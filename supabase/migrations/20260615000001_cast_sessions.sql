-- Akasha Cast: semantic lens broadcasting sessions

create table if not exists public.cast_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'live' check (status in ('live', 'ended')),
  presenter_lens_state jsonb not null default '{}'::jsonb,
  chrono_state jsonb not null default '{}'::jsonb,
  intent_relay_enabled boolean not null default true,
  chrono_lock_enabled boolean not null default false,
  viewer_count integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_cast_sessions_project on public.cast_sessions (project_id);
create index if not exists idx_cast_sessions_host on public.cast_sessions (host_user_id);
create index if not exists idx_cast_sessions_live on public.cast_sessions (project_id, status)
  where status = 'live';

create table if not exists public.cast_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cast_sessions(id) on delete cascade,
  token_hash text not null unique,
  role text not null default 'viewer'
    check (role in ('viewer', 'family', 'council_reviewer')),
  expires_at timestamptz not null,
  max_uses integer,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_cast_invites_session on public.cast_invites (session_id);

create table if not exists public.cast_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cast_sessions(id) on delete cascade,
  event_type text not null
    check (event_type in ('intent', 'lens', 'chrono', 'pin', 'join', 'end')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cast_events_session on public.cast_events (session_id, created_at);

alter table public.cast_sessions enable row level security;
alter table public.cast_invites enable row level security;
alter table public.cast_events enable row level security;

create policy cast_sessions_select_member on public.cast_sessions
  for select to authenticated
  using (
    host_user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = cast_sessions.project_id
        and public.is_project_member(p)
    )
  );

create policy cast_sessions_insert_host on public.cast_sessions
  for insert to authenticated
  with check (host_user_id = auth.uid());

create policy cast_sessions_update_host on public.cast_sessions
  for update to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

create policy cast_invites_select_host on public.cast_invites
  for select to authenticated
  using (
    exists (
      select 1 from public.cast_sessions s
      where s.id = cast_invites.session_id
        and s.host_user_id = auth.uid()
    )
  );

create policy cast_events_select_member on public.cast_events
  for select to authenticated
  using (
    exists (
      select 1 from public.cast_sessions s
      join public.projects p on p.id = s.project_id
      where s.id = cast_events.session_id
        and (s.host_user_id = auth.uid() or public.is_project_member(p))
    )
  );
