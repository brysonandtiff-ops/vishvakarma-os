# Vishvakarma.OS — Backend Migration Guide

**Last updated:** 2026-06-13  
**Current production backend:** Supabase Auth + Postgres + Storage (Supabase-only runtime)  
**Canonical production origin:** https://vishvakarma-os.app

For the current architecture summary, see [`docs/CURRENT_PRODUCTION_ARCHITECTURE.md`](docs/CURRENT_PRODUCTION_ARCHITECTURE.md).

---

## Current production path

Vishvakarma.OS v1.2.x runs on Supabase for:

- Authentication (email link, Google OAuth)
- Postgres persistence (projects, governance, billing entitlements, optimization history, profiles)
- Storage (uploads and custom textures)
- Server-side JWT verification for Stripe API routes

The SPA hardcodes `provider: 'supabase'` in `src/backend/backendConfig.ts`. There is no runtime Firebase/Supabase switch in current builds.

Required client env vars (see [`.env.example`](.env.example)):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app
```

Required server env vars:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=https://vishvakarma-os.app
```

`https://vishvakarma-os.vercel.app` may remain as a fallback/debug redirect origin, but it is not the canonical production origin.

Setup and verification:

```bash
pnpm run setup:supabase-auth
pnpm run setup:supabase-auth:full
pnpm run push:supabase-env-vercel
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:supabase-login-data
pnpm run verify:production-auth-flow
```

See [`docs/release/SUPABASE_AUTH_SETUP.md`](docs/release/SUPABASE_AUTH_SETUP.md) and [`supabase/README.md`](supabase/README.md).

---

## Data export and import

Migration utilities live under `scripts/migration/`:

| Script | Purpose |
|--------|---------|
| `export-supabase.mjs` | Export Supabase Postgres rows to JSON |
| `import-supabase.mjs` | Import JSON export into Supabase (`pnpm run migration:import-supabase`) |
| `validate-migration.mjs` | Validate export JSON shape before import |

Export:

```bash
node scripts/migration/export-supabase.mjs
```

Import:

```bash
pnpm run migration:import-supabase -- --in=migration/your-export.json
node scripts/migration/validate-migration.mjs migration/your-export.json
```

The `migration/` folder at repo root is a runtime staging area for export/import JSON (gitignored artifacts).

---

## Historical Firebase work

Earlier v1.2.x releases implemented Firebase Auth + Firestore alongside Supabase for dual-backend migration experiments. That path is **not** the current production runtime.

Legacy artifacts that may remain in the repo:

- `firestore.rules` (if present) — historical Firestore rules
- `scripts/production/setup-admin.mjs`, `setup-co-owner.mjs` — Firebase Admin SDK helpers for legacy operator workflows
- Release evidence files referencing Firebase OAuth setup

Do not describe Firebase as the live production backend in new documentation. Count Firebase engineering as portability and migration depth, not as an active second backend.

---

## Version migrations (app releases)

Application-level breaking changes and upgrade notes are recorded in [`CHANGELOG.md`](CHANGELOG.md).

Schema changes ship via `supabase/migrations/`:

```bash
npx supabase link --project-ref jyocvwipthswfcmvqgqe
npx supabase db push
pnpm run verify:supabase-schema:live
```

---

## Promote admin / co-owner (Supabase)

Production admin role is stored on the `profiles` table. After a user signs in once:

1. Open Supabase Dashboard → Table Editor → `profiles`
2. Set `role` to `admin` for their row

Co-owner billing and export entitlements are also configured via profile/billing columns and `src/config/coOwners.ts`. See [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md).

Legacy Firebase promotion scripts (`scripts/production/setup-admin.mjs`) require Firebase service account credentials and are not used on the Supabase production path.

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [`README.md`](README.md) | Primary project entry |
| [`docs/SOFTWARE_INVENTORY.md`](docs/SOFTWARE_INVENTORY.md) | Technical inventory |
| [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) | Production env matrix |
| [`docs/release/DEPLOYMENT.md`](docs/release/DEPLOYMENT.md) | Deployment guide |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contributor workflow |
