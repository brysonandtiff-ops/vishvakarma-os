# Supabase Auth + Postgres project

Production uses **Supabase Auth + Postgres + Storage**. The runtime provider is fixed in `src/backend/backendConfig.ts` (`provider: 'supabase'`).

Linked project: `jyocvwipthswfcmvqgqe` (**Vishvakarma.OS**)

## Migrations

`supabase/migrations/` is executable production history. Every timestamp in this directory must correspond to the production Supabase migration ledger; historical SQL snapshots must not live in this directory.

Core baseline:

| File | Purpose |
|------|---------|
| `20260212000001_create_core_tables.sql` | Core tables including `profiles` |
| `20260212000002_profiles_auth_trigger.sql` | Auto-create profile on sign-up |
| `20260212000003_rls_policies.sql` | RLS policies (uid-scoped + admin role) |
| `20260212000004_profiles_billing_optimization.sql` | Billing + optimization columns |
| `20260213000005_collab_and_storage.sql` | Collaboration metadata + storage buckets |

Security hardening continues through the dated July migrations and `20260810142840_restrict_audit_log_visibility.sql`.

### Historical live-remediation snapshot

`20260711194500_production_security_hardening.sql` was a repository snapshot of security changes that had already been applied directly to production. It was **not** a version recorded in the production migration ledger. Its durable effects are represented by the subsequent ledger-backed July migrations (`20260711194914` onward) and the verified live schema.

For that reason, the snapshot is preserved by Git history but intentionally excluded from `supabase/migrations/`. This prevents Supabase CLI/Git integration from treating an evidence snapshot as an out-of-order pending migration.

Before release, verify both directions:

1. every production migration version exists in Git;
2. every executable migration version in Git exists in the production ledger.

## CLI setup

```bash
npx supabase login
npx supabase link --project-ref jyocvwipthswfcmvqgqe
npx supabase db push
node scripts/setup-supabase-auth-providers.mjs
```

Or use the npm helper:

```bash
pnpm run setup:supabase-auth:full
```

## Verify

```bash
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
pnpm run test:supabase-auth:full
pnpm run verify:supabase-login-data
pnpm run verify:production-auth-flow
```

See [docs/release/SUPABASE_AUTH_SETUP.md](../docs/release/SUPABASE_AUTH_SETUP.md) and [MIGRATION.md](../MIGRATION.md).
