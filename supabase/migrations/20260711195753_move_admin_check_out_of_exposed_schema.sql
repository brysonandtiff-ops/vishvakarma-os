create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

alter function public.is_admin() set schema app_private;

revoke execute on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;
