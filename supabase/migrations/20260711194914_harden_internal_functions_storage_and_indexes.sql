revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists materials_select_public on storage.objects;

revoke all privileges on table public.ai_usage from anon, authenticated;

create index if not exists idx_change_requests_requester
  on public.change_requests (requester);

create index if not exists idx_change_requests_reviewer
  on public.change_requests (reviewer);

create index if not exists idx_optimization_batches_project_id
  on public.optimization_batches (project_id);
