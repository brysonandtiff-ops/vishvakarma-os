-- Users who opt into MFA expect every client database operation to require the
-- second factor. Users without a verified factor remain at AAL1 and keep access.

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create or replace function app_private.mfa_aal_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when exists (
      select 1
      from auth.mfa_factors factor
      where factor.user_id = (select auth.uid())
        and factor.status = 'verified'
    ) then coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    else true
  end;
$$;

revoke all on function app_private.mfa_aal_allowed() from public, anon;
grant execute on function app_private.mfa_aal_allowed() to authenticated;

comment on function app_private.mfa_aal_allowed() is
  'Allows AAL1 only when the current user has no verified MFA factor; otherwise requires AAL2.';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'audit_logs',
    'billing',
    'cast_events',
    'cast_invites',
    'cast_sessions',
    'change_requests',
    'optimization_batches',
    'profiles',
    'projects',
    'registry',
    'releases',
    'route_manifest',
    'specs'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format(
      'drop policy if exists mfa_opt_in_enforcement on public.%I',
      table_name
    );
    execute format(
      'create policy mfa_opt_in_enforcement on public.%I as restrictive for all to authenticated using (app_private.mfa_aal_allowed()) with check (app_private.mfa_aal_allowed())',
      table_name
    );
  end loop;
end
$$;
