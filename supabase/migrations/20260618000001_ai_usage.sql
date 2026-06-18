-- AI usage metering: per-user daily call counter for /api/ai/* cost + abuse control.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  call_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security;

-- No client policies are granted on purpose: only the service role (server) reads/writes
-- usage. The service role bypasses RLS; the absence of policies blocks anon/authenticated
-- client access entirely.

-- Atomic upsert+increment so concurrent requests cannot under-count. Returns the new
-- daily total for the user.
create or replace function public.increment_ai_usage(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_usage (user_id, usage_date, call_count, updated_at)
  values (p_user_id, (now() at time zone 'utc')::date, 1, now())
  on conflict (user_id, usage_date)
  do update set call_count = public.ai_usage.call_count + 1, updated_at = now()
  returning call_count into v_count;
  return v_count;
end;
$$;

-- Only the server (service role) may invoke the counter.
revoke all on function public.increment_ai_usage(uuid) from public;
revoke all on function public.increment_ai_usage(uuid) from anon;
revoke all on function public.increment_ai_usage(uuid) from authenticated;
