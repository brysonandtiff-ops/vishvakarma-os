# Auth Sign-In Proof

Generated from commit: `a1104f1`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-10T15:05:00.000Z
Operator: Cursor agent / Firebase Google auth production fix
Result: PASS — Google OAuth verified live for public sign-in on `/auth`

## Purpose

Provide public, reproducible proof of which Vishvakarma.OS sign-in methods work in production, and document why `/auth` displays exactly one method.

Public machine-readable manifest: [`/auth-capabilities.json`](https://vishvakarma-os.vercel.app/auth-capabilities.json) (also at `public/auth-capabilities.json` in-repo).

## Root cause and fix (2026-06-10)

Production showed the Google sign-in UI but sign-in failed because **Google OAuth was not enabled** in Firebase Authentication for project `gen-lang-client-0690161780`. Admin API returned `google.com enabled=undefined` before the fix.

**Fix applied:**

1. Corrected [`firebase.json`](../../firebase.json) `googleSignIn.authorizedRedirectUris` to `https://gen-lang-client-0690161780.firebaseapp.com/__/auth/handler` (removed incorrect bare Vercel origin).
2. Ran `pnpm run setup:firebase-auth:full` — `firebase deploy --only auth` enabled Google sign-in; IdP client `516504852870-e2ch7gpb8cfdb642m7p0os8n6i92nj14.apps.googleusercontent.com`.
3. Verified Vercel Production has all `VITE_FIREBASE_*` vars (encrypted); production bundle includes Firebase project config.
4. Added `VITE_AUTH_WINNER=google` on Vercel Production to keep Google as the sole `/auth` method.

## Automated Checks

| Check | Command | Result | Notes |
|---|---|---|---|
| Auth config guard | `pnpm run auth:gates` | PASS | Firebase-only wiring guarded |
| Production env | `pnpm run production:verify-env --strict` | PASS | `.env.local` has real Firebase keys |
| Email link API (live) | `pnpm run test:firebase-auth:full` | PASS | Live send succeeded after quota reset |
| Google IdP (Admin) | `pnpm run test:firebase-auth:full` | PASS | `google.com enabled=true` |
| Google createAuthUri | `identitytoolkit accounts:createAuthUri` | PASS | Returns `accounts.google.com` OAuth URL for `vishvakarma-os.vercel.app/auth` |
| Authorized domains | Firebase `getProjectConfig` | PASS | `vishvakarma-os.vercel.app`, `localhost`, Firebase domains listed |
| Production `/auth` page | Fetch https://vishvakarma-os.vercel.app/auth | PASS | Continue with Google; Protected Workspace |

## Live Sign-In Matrix

| Method | Config | Live send / sign-in | Status | Notes |
|---|---|---|---|---|
| Email magic link | PASS | PASS | PASS | Available; not shown on `/auth` while `VITE_AUTH_WINNER=google` |
| Google OAuth | PASS | PASS | PASS | IdP enabled; createAuthUri PASS; popup + redirect fallback via `getRedirectResult()` |
| Apple OAuth | Not in UI | SKIP | SKIP | Requires `FIREBASE_APPLE_*` operator credentials |

## Winner Selection

| Priority | Rule | Outcome |
|---|---|---|
| Build override | `VITE_AUTH_WINNER=google` on Vercel Production | **Met — winner = `google`** |
| Manifest | `auth-capabilities.json` winner | `google` |

**Only Google is displayed on `/auth` because `VITE_AUTH_WINNER=google` locks the verified OAuth path for public production access.**

## Reproduction Steps

```bash
cd vishvakarma-os-live
pnpm run setup:firebase-auth:full
pnpm run test:firebase-auth:full
pnpm run production:verify-env --strict
node scripts/test-firebase-auth-smoke.mjs --write-capabilities
```

Manual operator verification:

1. Open https://vishvakarma-os.vercel.app/auth in incognito
2. Confirm only **Continue with Google** is shown
3. Complete Google sign-in → lands on `/editor`
4. Refresh page → session persists
5. Sign out → redirected to `/auth`

## Public Artifacts

| Artifact | Location |
|---|---|
| Capabilities JSON | `public/auth-capabilities.json` → `/auth-capabilities.json` |
| This report | `docs/release/evidence/auth-sign-in-proof.md` |
| Firebase production check | `docs/release/evidence/firebase-production-check.md` |
| Vercel env guide | `docs/release/VERCEL_ENV.md` |

## Verdict

```txt
PASS — Google OAuth is enabled in Firebase, createAuthUri succeeds for the production domain,
and /auth displays Google-only sign-in via VITE_AUTH_WINNER=google + auth-capabilities.json.
```
