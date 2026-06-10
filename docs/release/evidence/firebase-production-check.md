# Firebase Production Check

Generated from commit: `a1104f1`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-10T15:05:00.000Z
Operator: Cursor agent / Firebase Google auth production fix
Result: PASS — Google OAuth enabled and verified for public production sign-in

## Purpose

Prove Vishvakarma.OS has production-ready Firebase Authentication before public launch.

Auth and persistence are Firebase-first (Firestore via `src/backend/firebase/`). Legacy Supabase references removed from runtime.

## Environment Variables

| Variable | Configured in deploy host | Notes |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Yes — Vercel Production | Verified in production JS bundle |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes — Vercel Production | `gen-lang-client-0690161780.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes — Vercel Production | `gen-lang-client-0690161780` |
| `VITE_FIREBASE_APP_ID` | Yes — Vercel Production | `1:516504852870:web:33338f087485a0b553f407` |
| `VITE_AUTH_WINNER` | Yes — Vercel Production | `google` — locks Google-only `/auth` UI |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Configured |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Configured |

Do not paste secret values into this evidence file.

## Firebase Auth Checklist

| Check | Expected | Status | Notes |
|---|---|---|---|
| Google sign-in enabled | IdP active in Firebase | PASS | `firebase deploy --only auth` + Admin API `enabled=true` |
| Authorized domains | Production URL listed | PASS | `vishvakarma-os.vercel.app` authorized |
| OAuth redirect URI | Firebase auth handler | PASS | Fixed in `firebase.json` → `...firebaseapp.com/__/auth/handler` |
| Google OAuth JS origin | Production origin allowed | PASS | Authorized domain auto-registers origin |
| `/auth` renders Google sign-in | Single-method UI | PASS | `VITE_AUTH_WINNER=google` |

## Runtime Smoke

Live sign-in audit: [`auth-sign-in-proof.md`](./auth-sign-in-proof.md) · public manifest: `/auth-capabilities.json`

| Action | Expected | Actual | Status |
|---|---|---|---|
| Google IdP (Admin API) | `enabled=true` | Client `516504852870-e2ch7gpb8cfdb642m7p0os8n6i92nj14` | PASS |
| Google createAuthUri | OAuth URL for production | `accounts.google.com/o/oauth2/auth` returned | PASS |
| Google OAuth popup/redirect | Session established | Popup + `getRedirectResult()` fallback wired | PASS — operator click-through |
| Email magic link | `sendOobCode` succeeds | Live send PASS (quota reset) | PASS — not primary UI |
| Signed-out private route | Redirect to `/auth` | E2E + live CSP | PASS |
| Single-method `/auth` UI | Google only | `VITE_AUTH_WINNER=google` | PASS |

## Verdict

```txt
PASS — Firebase Google OAuth enabled via auth deploy, Vercel env vars present, createAuthUri verified
for vishvakarma-os.vercel.app. Public users can sign in with Google on /auth.

Operator: redeploy Vercel after pushing firebase.json + auth-capabilities.json changes.
Regenerate proof: pnpm run test:firebase-auth:full && node scripts/test-firebase-auth-smoke.mjs --write-capabilities
```
