# Supabase archive project

Production login uses **Firebase Auth + Firestore**. This folder holds SQL migrations for the linked Supabase archive project (`jyocvwipthswfcmvqgqe`) used during Supabase → Firebase cutover.

## Migrations

| File | Purpose |
|------|---------|
| `20260212000001_create_core_tables.sql` | 8 tables including `profiles` (login data) |
| `20260212000002_profiles_auth_trigger.sql` | Auto-create profile on sign-up |
| `20260212000003_rls_policies.sql` | RLS policies (uid-scoped + admin role) |

## Apply to remote

```bash
supabase login
supabase link --project-ref jyocvwipthswfcmvqgqe
supabase db push
```

## Verify

```bash
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

See [MIGRATION.md](../MIGRATION.md) for export/import runbook.
