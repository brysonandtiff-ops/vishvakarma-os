create or replace function public.is_project_member(project_row public.projects)
returns boolean
language sql
stable
set search_path = public
as $$
  select project_row.user_id = auth.uid()
    or auth.uid() = any (project_row.collaborators);
$$;

create or replace function public.is_project_owner(project_row public.projects)
returns boolean
language sql
stable
set search_path = public
as $$
  select project_row.user_id = auth.uid();
$$;
