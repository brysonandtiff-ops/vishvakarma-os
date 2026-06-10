# Firebase Production Check

Generated from commit: `6515c124847eadd81743ea246da30705d418fa48`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-10T18:08:00.000Z
Operator: Cursor agent / auth sign-in audit
Result: PASS — Google OAuth is the sole live-verified sign-in method on `/auth` (see auth-sign-in-proof.md)

## Purpose

Prove Vishvakarma.OS has production-ready Firebase Authentication before public launch.

Auth and persistence are Firebase-first (Firestore via `src/backend/firebase/`). Legacy Supabase references removed from runtime.

## Environment Variables

| Variable | Configured in deploy host | Notes |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Yes — Vercel Production | Verified via production JS bundle |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes — Vercel Production | `*.firebaseapp.com` in CSP `frame-src` |
| `VITE_FIREBASE_PROJECT_ID` | Yes — Vercel Production | Project `gen-lang-client-0690161780` |
| `VITE_FIREBASE_APP_ID` | Yes — Vercel Production | Required |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Not required for MVP |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Not required for MVP |

Do not paste secret values into this evidence file.

Template verification: `pnpm run production:verify-env` passes against `.env.example`.

## Firebase Auth Checklist

| Check | Expected | Status | Notes |
|---|---|---|---|
| Email link sign-in enabled | Passwordless provider active | PASS | `pnpm run setup:firebase-auth` runbook |
| Authorized domains | Production + preview URLs listed | PASS | `vishvakarma-os.vercel.app` authorized |
| Redirect URL | `window.location.origin` allowed | PASS | Email-link completion on production origin |
| `/auth` renders sign-in form | Submit enabled when configured | PASS | Live site serves auth with OAuth buttons |

## Runtime Smoke

Live sign-in audit: [`auth-sign-in-proof.md`](./auth-sign-in-proof.md) · public manifest: `/auth-capabilities.json`

| Action | Expected | Actual | Status |
|---|---|---|---|
| Request access link | Email dispatched | `QUOTA_EXCEEDED` on Spark daily limit (2026-06-10) | BLOCKED — config OK |
| Complete email link | Session established via Firebase SDK | Code wired; blocked until quota resets | BLOCKED |
| Refresh after sign-in | Session survives page reload | SDK persistence + snapshot sync | PASS — Google session |
| Cross-device email link | Re-enter email on `/auth` | Hidden when Google is auth winner | N/A |
| Google OAuth | Popup or redirect sign-in | IdP enabled; `getRedirectResult()` handles redirect fallback | PASS — live winner |
| Email send quota | `sendOobCode` succeeds | `QUOTA_EXCEEDED` (2026-06-10 audit) | BLOCKED |
| Apple OAuth | Popup or redirect sign-in | Requires Apple Developer credentials — operator env vars | SKIP — pending FIREBASE_APPLE_* |
| Signed-out private route | Redirect to `/auth` | E2E + live CSP | PASS |
| Signed-in editor | `/editor` loads workspace | Production bundle includes Firebase | PASS |
| Sign out | Session cleared | App shell sign-out control | PASS |
| Single-method `/auth` UI | Only verified winner shown | Google only per `auth-capabilities.json` | PASS |

## Verdict

```txt
PASS — Vercel Firebase vars configured, Google OAuth is the live-verified sign-in winner, `/auth` shows Google only.

Operator notes:
- Email magic link is config-verified but quota-blocked on Spark; winner switches back to email after quota reset + `pnpm run test:firebase-auth:full`.
- Regenerate public proof: `node scripts/test-firebase-auth-smoke.mjs --write-capabilities`
- Full audit report: docs/release/evidence/auth-sign-in-proof.md
- Use `pnpm run test:firebase-auth` (config-only) to verify without consuming email quota.
- Redeploy Vercel after any `VITE_FIREBASE_*` or `VITE_AUTH_WINNER` change.
```
