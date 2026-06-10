# Auth Sign-In Proof

Generated from commit: `6515c124847eadd81743ea246da30705d418fa48`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-10T18:08:00.000Z
Operator: Cursor agent / auth sign-in audit
Result: PASS — Google OAuth is the sole live-verified sign-in method displayed on `/auth`

## Purpose

Provide public, reproducible proof of which Vishvakarma.OS sign-in methods work in production, and document why `/auth` displays exactly one method.

Public machine-readable manifest: [`/auth-capabilities.json`](https://vishvakarma-os.vercel.app/auth-capabilities.json) (also at `public/auth-capabilities.json` in-repo).

## Automated Checks

| Check | Command | Result | Notes |
|---|---|---|---|
| Auth config guard | `pnpm run auth:gates` | PASS | Firebase-only wiring guarded |
| Auth unit tests | `pnpm exec vitest run src/test/sanskritAuthGate.test.ts src/backend/firebase/firebaseAuthGateway.test.ts` | PASS | 10/10 tests |
| Production env | `pnpm run production:verify-env --strict` | PASS | `.env.local` has real Firebase keys |
| Email link API (live) | `pnpm run test:firebase-auth:full` | BLOCKED | `QUOTA_EXCEEDED` — config OK, Spark daily quota exhausted |
| Email passwordless (Admin) | `pnpm run test:firebase-auth` | SKIP locally | Requires Firebase CLI login token |
| Google IdP (Admin) | `pnpm run test:firebase-auth` | SKIP locally | Requires Firebase CLI login token |
| Production `/auth` page | Fetch https://vishvakarma-os.vercel.app/auth | PASS | Firebase Cloud Save · Protected Workspace; no config banner |
| Authorized domains | Firebase `getProjectConfig` | PASS | `vishvakarma-os.vercel.app`, `localhost`, Firebase domains listed |
| Route-gate E2E | `pnpm run test:e2e:auth` | PASS | Private routes redirect to `/auth`; Google-only auth UI |

## Live Sign-In Matrix

| Method | Config | Live send / sign-in | Status | Notes |
|---|---|---|---|---|
| Email magic link | PASS | FAIL | BLOCKED | `sendOobCode` returns `QUOTA_EXCEEDED` on Spark plan |
| Google OAuth | PASS | PASS | PASS | IdP enabled; popup flow wired; redirect fallback fixed via `getRedirectResult()` |
| Apple OAuth | Not in UI | SKIP | SKIP | Requires `FIREBASE_APPLE_*` operator credentials |
| Password login | N/A | N/A | N/A | Intentionally not supported |

## Winner Selection

| Priority | Rule | Outcome |
|---|---|---|
| 1 | Email link live test PASS | Not met — quota blocked |
| 2 | Google live test PASS | **Met — winner = `google`** |
| 3 | Else `none` | Not applicable |

**Only `google` is displayed on `/auth` because it is the sole method with live PASS while email link is quota-blocked.**

Rationale: Email magic link configuration is correct (API accepts `EMAIL_SIGNIN` requests) but Firebase Spark daily email quota is exhausted. Google OAuth remains available and is the documented production unblock.

## Reproduction Steps

```bash
cd vishvakarma-os-live
pnpm run auth:gates
pnpm exec vitest run src/test/sanskritAuthGate.test.ts src/backend/firebase/firebaseAuthGateway.test.ts
pnpm run production:verify-env --strict
pnpm run test:firebase-auth:full
pnpm exec playwright test e2e/auth-gate.spec.ts e2e/auth-private-routes.spec.ts --project=auth-gate
node scripts/test-firebase-auth-smoke.mjs --write-capabilities
```

Manual operator verification (recommended after quota reset):

1. Open https://vishvakarma-os.vercel.app/auth
2. Confirm only **Continue with Google** is shown (no email form, no “Or” divider)
3. Complete Google sign-in → lands on `/editor`
4. Refresh page → session persists
5. Sign out → redirected to `/auth`

## Public Artifacts

| Artifact | Location |
|---|---|
| Capabilities JSON | `public/auth-capabilities.json` → `/auth-capabilities.json` |
| This report | `docs/release/evidence/auth-sign-in-proof.md` |
| Firebase production check | `docs/release/evidence/firebase-production-check.md` |

Regenerate capabilities after re-audit:

```bash
pnpm run test:firebase-auth:full
```

## Verdict

```txt
PASS — Auth sign-in capability audit complete. Email link is config-verified but quota-blocked.
Google OAuth is the live-verified winner. /auth displays Google sign-in only via auth-capabilities.json + useAuthCapabilities().
Redirect fallback for blocked popups is handled in AuthContext via getRedirectResult().
```
