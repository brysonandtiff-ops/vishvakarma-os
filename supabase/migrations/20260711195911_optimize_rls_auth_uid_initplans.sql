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
