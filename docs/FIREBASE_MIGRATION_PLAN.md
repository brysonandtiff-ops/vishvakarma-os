# Vishvakarma.OS — Firebase Auth + Firestore Migration Plan

## Why this exists

Supabase quota exhaustion can block magic-link auth and persistence. Firebase Auth + Firestore is the preferred fallback path because it gives Vishvakarma.OS a generous free auth layer and a simple document database for projects, governance records, and audit evidence.

## Migration principle

Do not rip Supabase out in one step.

Vishvakarma.OS should support a provider switch:

```env
VITE_BACKEND_PROVIDER=firebase
```

or:

```env
VITE_BACKEND_PROVIDER=supabase
```

This keeps the app reversible while Firebase is added.

---

## Phase 1 — Provider foundation

Status: started.

Required files:

- `src/backend/backendTypes.ts`
- `src/backend/backendConfig.ts`
- `src/backend/backendConfig.test.ts`
- `.env.example`

Goal:

- Define the backend contract.
- Detect whether Supabase or Firebase is active.
- Reject placeholder env values.
- Keep the app build-safe while runtime wiring is added later.

---

## Phase 2 — Firebase Auth adapter

Target files:

- `src/backend/firebase/firebaseClient.ts`
- `src/backend/firebase/firebaseAuthGateway.ts`
- `src/contexts/AuthContext.tsx`

Goal:

- Add Firebase app initialization.
- Support passwordless email-link auth.
- Preserve the existing `requestAccessLink(email)` interface.
- Keep Supabase auth as a fallback until Firebase is proven.

Required Firebase console setup:

1. Create Firebase project.
2. Add a Web app.
3. Enable Authentication.
4. Enable Email/Password provider.
5. Enable email-link sign-in if using passwordless links.
6. Add deployed domain to Authorized domains.
7. Add local development domain if needed.

Required env vars:

```env
VITE_BACKEND_PROVIDER=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Phase 3 — Firestore project data adapter

Target files:

- `src/backend/firebase/firebaseProjectGateway.ts`
- `src/db/api.ts` or a new provider-backed replacement

Firestore collections:

```text
projects
specs
registry_entries
change_requests
releases
audit_logs
profiles
```

Project document shape should preserve the current `Project` and `ProjectManifest` contract.

---

## Phase 4 — Governance data migration

Move these Supabase tables into Firestore collections:

- `specs`
- `registry`
- `change_requests`
- `releases`
- `audit_logs`

Required rule:

Do not change UI pages while migrating storage. Keep the current page contracts and swap only the backend adapter.

---

## Phase 5 — Verification gates

Required commands before merge:

```bash
pnpm run lint
pnpm run test
pnpm run build
pnpm run verify:ci
```

Manual checks:

- `/auth` sends a Firebase email-link when Firebase is configured.
- `/auth` shows a clear local-only warning when Firebase env vars are missing.
- Project create/load/save works against Firestore.
- Export still uses canonical project JSON.
- Supabase mode still works when `VITE_BACKEND_PROVIDER=supabase` and Supabase env vars are valid.

---

## Stop-ship conditions

Do not merge Firebase runtime wiring if:

- Auth works only in Firebase but breaks Supabase mode.
- Project data shape changes without migration logic.
- Firestore documents lose `ProjectManifest` compatibility.
- Local-only mode crashes.
- Firebase config placeholders are treated as connected.
- Magic-link errors become vague again.

---

## Rollback

Set:

```env
VITE_BACKEND_PROVIDER=supabase
```

Then revert Firebase adapter PRs if needed. Keep provider foundation files unless they are the cause of the regression.
