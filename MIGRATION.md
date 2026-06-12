# Migration Guide — Vishvakarma.OS

This document covers upgrading between Vishvakarma.OS versions and migrating from legacy Supabase to Firebase.

## Version upgrades

### v1.0.0 → v1.1.0

- Project manifest schema is backward-compatible. Import existing `.json` exports without changes.
- New optional manifest fields: `labels`, `dimensions`, `furniture`, `dimensionVisibility`.
- PDF export now includes a visual floor-plan raster when exported from the editor.

### v1.1.0 → v1.2.0

- Custom materials are stored in `manifest.materials[]` with optional `textureUrl`.
- Lighting fixtures use `manifest.fixtures[]` (MEP workspace).
- Multi-floor projects use `manifest.floors[]` with per-wall `floorIndex` (preview scaffolding for v2.0).

## Supabase archive schema

Production login uses **Supabase Auth + Postgres** by default (`VITE_BACKEND_PROVIDER=supabase`). Firebase Auth + Firestore remains available for rollback (`VITE_BACKEND_PROVIDER=firebase`).

Schema is versioned in [`supabase/migrations/`](supabase/migrations/):

1. `20260212000001_create_core_tables.sql` — 8 tables including `profiles` (login data)
2. `20260212000002_profiles_auth_trigger.sql` — auto-create profile on `auth.users` insert
3. `20260212000003_rls_policies.sql` — uid-scoped RLS + admin via `profiles.role`

Apply to the linked Supabase project:

```bash
cd vishvakarma-os-live
supabase link --project-ref jyocvwipthswfcmvqgqe
supabase db push
```

Verify locally (static) or against remote (live):

```bash
pnpm run verify:supabase-schema
pnpm run verify:firebase-login-data
# With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY:
pnpm run verify:supabase-schema:live
```

## Supabase → Firebase cutover

Vishvakarma.OS runtime is **Firebase-only** (Auth + Firestore). Supabase is no longer used by the application.

### Pre-cutover

1. Announce a maintenance window.
2. Freeze writes in Supabase.
3. Export data:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
node scripts/migration/export-supabase.mjs
```

4. Validate the export:

```bash
node scripts/migration/validate-migration.mjs migration/export-*.json
```

### Import to Firestore

1. Create or select a Firebase project and enable Firestore (production mode).
2. Deploy security rules:

```bash
firebase deploy --only firestore:rules --project your-firebase-project-id
```

3. Import data:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
export FIREBASE_PROJECT_ID=your-firebase-project-id
node scripts/migration/import-firestore.mjs migration/export-*.json
```

4. Smoke test on staging: auth, project save/load, registry, releases, audit log.

### Vercel environment

**Remove** (legacy):

- `VITE_BACKEND_PROVIDER`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Set** (required):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Optional: `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`

See [docs/release/VERCEL_ENV.md](docs/release/VERCEL_ENV.md) for the full checklist.

### Post-cutover

1. Deploy the Firebase-only build.
2. Re-run `pnpm run release:gates`.
3. Keep Supabase export JSON as rollback archive for 14–30 days.
4. Promote admin users:

```bash
node scripts/production/setup-admin.mjs admin@example.com
```

### Rollback

Restore the previous Vercel deployment and re-enable Supabase env vars from archive. Do not delete export JSON until sign-off.

## Detailed runbook

See [docs/release/FIREBASE_CUTOVER.md](docs/release/FIREBASE_CUTOVER.md) for operator step-by-step instructions.
