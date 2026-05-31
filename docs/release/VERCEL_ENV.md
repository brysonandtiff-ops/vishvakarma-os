# Vercel Production Environment Variables

Configure these in the Vercel project **Settings → Environment Variables** for **Production** (and Preview if you want auth on preview URLs) before deploying Vishvakarma.OS.

The app is **Firebase-only**. Supabase variables are no longer used by the runtime build.

## Required (Firebase Auth + Firestore)

| Variable | Where to find it |
|----------|------------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → General → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |

## Recommended (optional but useful)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_STORAGE_BUCKET` | Future file uploads |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase SDK completeness |

## Remove from Vercel (legacy)

Delete these if still present — they are ignored by the current app and can cause confusion:

- `VITE_BACKEND_PROVIDER`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Firebase Console checklist (before first deploy)

1. **Authentication → Sign-in method**
   - Enable **Email link (passwordless sign-in)** under Email/Password
   - Optionally enable **Google** and **Apple**
2. **Authentication → Settings → Authorized domains**
   - Add your production domain (e.g. `vishvakarma-os.vercel.app`)
   - Add `localhost` for local dev
   - Add Vercel preview domain pattern if testing preview deploys
3. **Firestore Database**
   - Create database (production mode)
   - Deploy rules from this repo (see below)

## Deploy Firestore security rules

From the repo root, with [Firebase CLI](https://firebase.google.com/docs/cli) installed and logged in:

```bash
firebase login
firebase use your-firebase-project-id
firebase deploy --only firestore:rules
```

Rules file: [`firestore.rules`](../../firestore.rules)  
Config: [`firebase.json`](../../firebase.json)

## Vercel redeploy (required after env changes)

Vite inlines `VITE_*` at **build time**. After adding or changing Firebase env vars:

1. Vercel → **Deployments** → **Redeploy** latest `main` (or push a commit)
2. Do not rely on a runtime-only env change without a new build

## Local development

```bash
cp .env.example .env.local
# Edit .env.local with real Firebase Web app values (not placeholders)
pnpm run dev
```

Validate template:

```bash
pnpm run production:verify-env
pnpm run production:verify-env --strict   # also checks .env.local values
```

## Migrating data from Supabase

If you had production data in Supabase, follow [`FIREBASE_CUTOVER.md`](./FIREBASE_CUTOVER.md) **before** deleting the old Supabase project.

## Post-deploy smoke test

1. Open production URL in incognito — console should **not** mention Supabase
2. If Firebase env is set: only a single config warning if something is missing; otherwise no backend warnings
3. `/auth` — request email link or OAuth sign-in
4. `/editor` — create project, save, reload, confirm cloud save badge shows **Firebase Cloud Save**
5. `/registry`, `/releases`, `/audit-log` — pages load (empty until Firestore has data)

## Promote an admin user

Requires a Firebase service account (not the Web API key):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
node scripts/production/setup-admin.mjs admin@example.com
```

## Build settings (vercel.json)

| Setting | Value |
|---------|-------|
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm run build` |
| Output | `dist` |

## Related docs

- [Firebase cutover runbook](./FIREBASE_CUTOVER.md)
- [Production readiness](./PRODUCTION_READINESS.md)
- [Evidence manifest](./evidence/EVIDENCE_MANIFEST.md)
