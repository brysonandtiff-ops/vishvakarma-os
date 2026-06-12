-- Row Level Security — uid-scoped access; admin via profiles.role (not user_metadata)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- profiles
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- projects
alter table public.projects enable row level security;

create policy projects_select_own on public.projects
  for select to authenticated
  using (user_id = auth.uid());

create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (user_id = auth.uid());

create policy projects_update_own on public.projects
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy projects_delete_own on public.projects
  for delete to authenticated
  using (user_id = auth.uid());

-- specs
alter table public.specs enable row level security;

create policy specs_select_authenticated on public.specs
  for select to authenticated
  using (true);

create policy specs_insert_admin on public.specs
  for insert to authenticated
  with check (public.is_admin());

create policy specs_update_admin on public.specs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy specs_delete_admin on public.specs
  for delete to authenticated
  using (public.is_admin());

-- registry
alter table public.registry enable row level security;

create policy registry_select_authenticated on public.registry
  for select to authenticated
  using (true);

create policy registry_insert_admin on public.registry
  for insert to authenticated
  with check (public.is_admin());

create policy registry_update_admin on public.registry
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy registry_delete_admin on public.registry
  for delete to authenticated
  using (public.is_admin());

-- change_requests
alter table public.change_requests enable row level security;

create policy change_requests_select_authenticated on public.change_requests
  for select to authenticated
  using (true);

create policy change_requests_insert_authenticated on public.change_requests
  for insert to authenticated
  with check (requester is null or requester = auth.uid());

create policy change_requests_update_owner_or_admin on public.change_requests
  for update to authenticated
  using (public.is_admin() or requester = auth.uid())
  with check (public.is_admin() or requester = auth.uid());

create policy change_requests_delete_admin on public.change_requests
  for delete to authenticated
  using (public.is_admin());

-- releases
alter table public.releases enable row level security;

create policy releases_select_authenticated on public.releases
  for select to authenticated
  using (true);

create policy releases_insert_admin on public.releases
  for insert to authenticated
  with check (public.is_admin());

create policy releases_update_admin on public.releases
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy releases_delete_admin on public.releases
  for delete to authenticated
  using (public.is_admin());

-- audit_logs
alter table public.audit_logs enable row level security;

create policy audit_logs_select_authenticated on public.audit_logs
  for select to authenticated
  using (true);

create policy audit_logs_insert_authenticated on public.audit_logs
  for insert to authenticated
  with check (true);

create policy audit_logs_update_admin on public.audit_logs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy audit_logs_delete_admin on public.audit_logs
  for delete to authenticated
  using (public.is_admin());

-- route_manifest
alter table public.route_manifest enable row level security;

create policy route_manifest_select_authenticated on public.route_manifest
  for select to authenticated
  using (true);

create policy route_manifest_insert_admin on public.route_manifest
  for insert to authenticated
  with check (public.is_admin());

create policy route_manifest_update_admin on public.route_manifest
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy route_manifest_delete_admin on public.route_manifest
  for delete to authenticated
  using (public.is_admin());
