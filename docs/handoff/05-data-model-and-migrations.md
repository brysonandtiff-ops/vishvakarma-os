# Annex 05 — Data Model and Migrations

[← Handoff index](./HANDOFF.md)

**Auto-generated schema summary:** [Appendix D](./appendices/D-database-schema.md)

## Supabase project

| Item | Value |
|------|-------|
| Project ref | `jyocvwipthswfcmvqgqe` |
| CLI config | [`supabase/config.toml`](../../supabase/config.toml) |
| README | [`supabase/README.md`](../../supabase/README.md) |

## Migration files (apply in order)

| File | Purpose |
|------|---------|
| `20260212000001_create_core_tables.sql` | Core tables: profiles, projects, specs, registry, change_requests, releases, audit_logs, route_manifest |
| `20260212000002_profiles_auth_trigger.sql` | `handle_new_user()` on `auth.users` insert |
| `20260212000003_rls_policies.sql` | RLS on all core tables + `is_admin()` |
| `20260212000004_profiles_billing_optimization.sql` | billing table, optimization_batches, profile Stripe columns |
| `20260213000005_collab_and_storage.sql` | Project collaborators, collab_snapshot, materials storage bucket |

Apply: `npx supabase db push` or `pnpm run setup:supabase-auth:full`

## Tables (`public` schema)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile; `role` for admin; Stripe customer columns |
| `projects` | Blueprint projects; `manifest` jsonb; collaborators, collab_snapshot |
| `specs` | Governance specifications |
| `registry` | Component/feature/tool catalog |
| `change_requests` | Governed change workflow |
| `releases` | Release records + evidence packs |
| `audit_logs` | Governance action timeline |
| `route_manifest` | Route registry in DB |
| `billing` | Stripe plan/status per user |
| `optimization_batches` | Optimization run history |

## Auth trigger

`handle_new_user()` — creates `profiles` row when Supabase Auth user is created ([`20260212000002_profiles_auth_trigger.sql`](../../supabase/migrations/20260212000002_profiles_auth_trigger.sql)).

## Storage

Bucket **`materials`** — public read; insert/update/delete scoped to `auth.uid()` path prefix ([`20260213000005_collab_and_storage.sql`](../../supabase/migrations/20260213000005_collab_and_storage.sql)).

Client: [`src/backend/supabase/supabaseStorageGateway.ts`](../../src/backend/supabase/supabaseStorageGateway.ts).

## Application data models

| Model | Type file |
|-------|-----------|
| `ProjectManifest` | [`src/types/types.ts`](../../src/types/types.ts) |
| `Project`, governance entities | [`src/types/types.ts`](../../src/types/types.ts), [`src/types/index.ts`](../../src/types/index.ts) |
| `BillingSubscription` | [`src/types/billing.ts`](../../src/types/billing.ts) |

Schema doc: [`docs/project-manifest-schema.md`](../project-manifest-schema.md)  
Route manifest: [`docs/route-manifest-schema.md`](../route-manifest-schema.md)

## Data portability

| Script | Path |
|--------|------|
| Export Postgres → JSON | [`scripts/migration/export-supabase.mjs`](../../scripts/migration/export-supabase.mjs) |
| Import JSON → Supabase | [`scripts/migration/import-supabase.mjs`](../../scripts/migration/import-supabase.mjs) |
| Validate export shape | [`scripts/migration/validate-migration.mjs`](../../scripts/migration/validate-migration.mjs) |

Guide: [`MIGRATION.md`](../../MIGRATION.md)

Export artifacts: `migration/export-*.json` (gitignored).

## Sample data (not DB seeds)

[`public/samples/`](../../public/samples/) — JSON sample projects for demos and tests.

No SQL seed files. Admin promotion via Supabase Dashboard (`profiles.role = 'admin'`).
