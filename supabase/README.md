# Supabase Auth + Postgres project

Production login uses **Supabase Auth + Postgres** when `VITE_BACKEND_PROVIDER=supabase` (default).

Linked project: `jyocvwipthswfcmvqgqe` (**Vishvakarma.OS**)

## Migrations

| File | Purpose |
|------|---------|
| `20260212000001_create_core_tables.sql` | Core tables including `profiles` |
| `20260212000002_profiles_auth_trigger.sql` | Auto-create profile on sign-up |
| `20260212000003_rls_policies.sql` | RLS policies (uid-scoped + admin role) |
| `20260212000004_profiles_billing_optimization.sql` | Billing + optimization columns |

## CLI setup

```bash
npx supabase login
npx supabase link --project-ref jyocvwipthswfcmvqgqe
npx supabase db push
node scripts/setup-supabase-auth-providers.mjs
```

## Verify

```bash
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
pnpm run test:supabase-auth:full
pnpm run verify:supabase-login-data
```

See [docs/release/SUPABASE_AUTH_SETUP.md](../docs/release/SUPABASE_AUTH_SETUP.md) and [MIGRATION.md](../MIGRATION.md).
