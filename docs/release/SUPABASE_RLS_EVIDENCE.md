# Supabase RLS Evidence Runbook

Use this runbook after applying the Supabase migrations. Attach screenshots or copied query output to the production evidence pack.

## Required proof

| Proof | Expected result |
|---|---|
| Table RLS state | `profiles`, `projects`, `specs`, `registry`, `change_requests`, `releases`, and `audit_logs` have RLS enabled when present. |
| Policy inventory | Owner/read/write policies exist for each protected table. |
| User ownership column | Protected app tables have a `user_id` ownership column. |
| Account profile creation | Creating an account through `/auth` creates a matching row in `profiles`. |
| Supabase advisor output | Security advisor has no unresolved RLS-critical warning for production tables. |

## Query 1 — table RLS state

Run this in the Supabase SQL Editor:

```sql
select schemaname, tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'projects', 'specs', 'registry', 'change_requests', 'releases', 'audit_logs')
order by tablename;
```

Expected: every returned table has `rls_enabled = true`.

## Query 2 — policy inventory

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'projects', 'specs', 'registry', 'change_requests', 'releases', 'audit_logs')
order by tablename, policyname;
```

Expected policy names include:

- `profiles_select_own`
- `profiles_update_own`
- `projects_owner_all`
- `specs_owner_all`
- `registry_owner_all`
- `change_requests_owner_all`
- `releases_owner_all`
- `audit_logs_owner_read`
- `audit_logs_owner_insert`

## Query 3 — protected ownership columns

```sql
select table_schema, table_name, column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('projects', 'specs', 'registry', 'change_requests', 'releases', 'audit_logs')
  and column_name = 'user_id'
order by table_name;
```

Expected: each returned protected app table has a `user_id` column with an auth-user default.

## Query 4 — account profile creation proof

Create a test account through `/auth`, complete the email-link sign-in, then run:

```sql
select id, email, created_at, updated_at
from public.profiles
order by created_at desc
limit 5;
```

Expected: the newly created test account appears in `profiles`.

## Manual browser evidence

1. Open `/auth` signed out.
2. Request a secure access link.
3. Complete sign-in from the email link.
4. Confirm `/` loads after sign-in.
5. Sign out from the app shell.
6. Attempt `/releases` while signed out and confirm redirect to `/auth`.

## Supabase advisor evidence

Run Supabase security advisors for the connected project and attach the output. Any RLS or exposed-table warning against production tables is a stop-ship issue unless formally accepted in the release evidence.
