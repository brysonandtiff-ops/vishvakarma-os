-- Vishvakarma.OS production security hardening
-- Mirrors the verified live remediation applied on 2026-07-11.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke execute on function public.handle_new_user() from public, anon, authenticated';
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;

  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.is_admin()') is not null then
    execute 'alter function public.is_admin() set schema app_private';
  end if;

  if to_regprocedure('app_private.is_admin()') is not null then
    execute 'revoke execute on function app_private.is_admin() from public, anon';
    execute 'grant execute on function app_private.is_admin() to authenticated';
  end if;
end
$$;

drop policy if exists materials_select_public on storage.objects;

revoke all privileges on table public.ai_usage from anon, authenticated;

alter table public.audit_logs
  add column if not exists actor_id uuid
  references auth.users (id) on delete set null
  default auth.uid();

create index if not exists idx_audit_logs_actor_timestamp
  on public.audit_logs (actor_id, timestamp desc);

create index if not exists idx_change_requests_requester
  on public.change_requests (requester);

create index if not exists idx_change_requests_reviewer
  on public.change_requests (reviewer);

create index if not exists idx_optimization_batches_project_id
  on public.optimization_batches (project_id);

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
revoke all privileges on table public.audit_logs from authenticated;
grant select, insert on table public.audit_logs to authenticated;

-- Eliminate accidental anonymous table grants. RLS remains the row-level
-- boundary for signed-in users, while anonymous clients cannot discover or
-- invoke authenticated-only CRUD surfaces through PostgREST/GraphQL.
revoke all privileges on table public.billing from anon;
revoke all privileges on table public.cast_events from anon;
revoke all privileges on table public.cast_invites from anon;
revoke all privileges on table public.cast_sessions from anon;
revoke all privileges on table public.change_requests from anon;
revoke all privileges on table public.optimization_batches from anon;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.projects from anon;
revoke all privileges on table public.registry from anon;
revoke all privileges on table public.releases from anon;
revoke all privileges on table public.route_manifest from anon;
revoke all privileges on table public.specs from anon;

-- Keep authenticated grants aligned with the application API rather than ALL.
revoke all privileges on table public.billing from authenticated;
grant select, insert, update on table public.billing to authenticated;

revoke all privileges on table public.cast_events from authenticated;
grant select on table public.cast_events to authenticated;

revoke all privileges on table public.cast_invites from authenticated;
grant select on table public.cast_invites to authenticated;

revoke all privileges on table public.cast_sessions from authenticated;
grant select, insert, update on table public.cast_sessions to authenticated;

revoke all privileges on table public.change_requests from authenticated;
grant select, insert, update, delete on table public.change_requests to authenticated;

revoke all privileges on table public.optimization_batches from authenticated;
grant select, insert, update on table public.optimization_batches to authenticated;

revoke all privileges on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

revoke all privileges on table public.projects from authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

revoke all privileges on table public.registry from authenticated;
grant select, insert, update, delete on table public.registry to authenticated;

revoke all privileges on table public.releases from authenticated;
grant select, insert, update, delete on table public.releases to authenticated;

revoke all privileges on table public.route_manifest from authenticated;
grant select, insert, update, delete on table public.route_manifest to authenticated;

revoke all privileges on table public.specs from authenticated;
grant select, insert, update, delete on table public.specs to authenticated;

-- Force auth.uid() into an init-plan once per statement instead of invoking it
-- for every candidate row. This preserves policy semantics while reducing RLS
-- overhead on large tables.
do $$
declare
  policy_record record;
  statement text;
begin
  for policy_record in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      p.polname as policy_name,
      pg_get_expr(p.polqual, p.polrelid) as using_expression,
      pg_get_expr(p.polwithcheck, p.polrelid) as check_expression
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%auth.uid()%'
        or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%auth.uid()%'
      )
      and (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') not like '%SELECT auth.uid()%'
        or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') not like '%SELECT auth.uid()%'
      )
  loop
    statement := format(
      'alter policy %I on %I.%I',
      policy_record.policy_name,
      policy_record.schema_name,
      policy_record.table_name
    );

    if policy_record.using_expression is not null then
      statement := statement || format(
        ' using (%s)',
        replace(policy_record.using_expression, 'auth.uid()', '(select auth.uid())')
      );
    end if;

    if policy_record.check_expression is not null then
      statement := statement || format(
        ' with check (%s)',
        replace(policy_record.check_expression, 'auth.uid()', '(select auth.uid())')
      );
    end if;

    execute statement;
  end loop;
end
$$;
