-- Restrict audit-log visibility to the authenticated actor or an administrator.
-- Legacy rows with no actor remain visible to admins only.

drop policy if exists audit_logs_select_authenticated on public.audit_logs;

create policy audit_logs_select_owner_or_admin
  on public.audit_logs
  for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or app_private.is_admin()
  );
