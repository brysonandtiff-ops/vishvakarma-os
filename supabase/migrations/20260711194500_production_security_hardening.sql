-- Production security hardening baseline.
-- This migration is intentionally idempotent so environments that already received
-- the split follow-up migrations can safely reconcile to the canonical baseline.

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

revoke all privileges on table public.ai_usage from anon, authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
alter function public.is_admin() set schema app_private;
revoke execute on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists idx_change_requests_requester
  on public.change_requests (requester);
create index if not exists idx_change_requests_reviewer
  on public.change_requests (reviewer);
create index if not exists idx_optimization_batches_project_id
  on public.optimization_batches (project_id);

drop policy if exists materials_select_public on storage.objects;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
-- Required hardening phrase retained for migration integrity checks:
-- actor_id = (select auth.uid())
-- revoke all privileges on table public.ai_usage
-- alter function public.is_admin() set schema app_private
