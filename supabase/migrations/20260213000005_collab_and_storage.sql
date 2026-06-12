-- Collab snapshot + collaborators on projects; materials storage bucket

alter table public.projects
  add column if not exists collaborators uuid[] not null default '{}',
  add column if not exists collab_snapshot jsonb;

create index if not exists idx_projects_collaborators on public.projects using gin (collaborators);

-- Backfill: owner is always a collaborator
update public.projects
set collaborators = array[user_id]::uuid[]
where collaborators = '{}'::uuid[] or collaborators is null;

create or replace function public.is_project_member(project_row public.projects)
returns boolean
language sql
stable
as $$
  select project_row.user_id = auth.uid()
    or auth.uid() = any (project_row.collaborators);
$$;

create or replace function public.is_project_owner(project_row public.projects)
returns boolean
language sql
stable
as $$
  select project_row.user_id = auth.uid();
$$;

-- Replace owner-only project policies with owner + collaborator access
drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_update_own on public.projects;

create policy projects_select_member on public.projects
  for select to authenticated
  using (public.is_project_member(projects));

create policy projects_update_member on public.projects
  for update to authenticated
  using (public.is_project_member(projects))
  with check (
    public.is_project_member(projects)
    and (
      public.is_project_owner(projects)
      or collaborators = (select p.collaborators from public.projects p where p.id = projects.id)
    )
  );

-- Storage: custom material textures (replaces Firebase Storage materials/{userId}/*)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy materials_select_public on storage.objects
  for select to public
  using (bucket_id = 'materials');

create policy materials_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy materials_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy materials_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
