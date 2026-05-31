# Firebase cutover runbook

Vishvakarma.OS now uses **Firebase Auth + Firestore only**. Supabase is no longer part of the runtime app.

## Pre-cutover

1. Announce a maintenance window.
2. Freeze writes in Supabase (disable client keys or enable read-only mode).
3. Export data:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
node scripts/migration/export-supabase.mjs
```

4. Validate the export archive:

```bash
node scripts/migration/validate-migration.mjs migration/export-*.json
```

## Import to Firestore

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

## Vercel environment

Remove:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_PROVIDER`

Set:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- Optional: `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`

## Post-cutover

1. Deploy the Firebase-only app build.
2. Re-run validation against production Firestore if needed.
3. Keep Supabase project read-only for 14–30 days as rollback archive.
4. Promote admin users in Firebase:

```bash
node scripts/production/setup-admin.mjs admin@example.com
```

## Rollback

If cutover fails, restore previous Vercel deployment and re-enable Supabase env vars from archive. Do not delete Supabase export JSON until sign-off.
