alter table public.audit_logs
  add column if not exists actor_id uuid
  references auth.users (id) on delete set null
  default auth.uid();

create index if not exists idx_audit_logs_actor_timestamp
  on public.audit_logs (actor_id, timestamp desc);

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;

create policy audit_logs_insert_authenticated
  on public.audit_logs
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and actor_id = (select auth.uid())
    and char_length(btrim(action)) between 1 and 120
    and char_length(btrim(entity_type)) between 1 and 80
    and timestamp >= now() - interval '5 minutes'
    and timestamp <= now() + interval '1 minute'
    and (details is null or jsonb_typeof(details) = 'object')
  );

revoke all privileges on table public.audit_logs from anon;
grant select, insert on table public.audit_logs to authenticated;
