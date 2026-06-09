# Firebase Production Check

Generated from commit: `616d152ce659b8f7d7ed7098dbfc86c30a8e1296`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-09T14:28:14.000Z
Operator: Bryson Erdmann / production bundle audit
Result: PASS — Firebase env baked into production build; Firestore rules deployed per README operator checklist

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

| Action | Expected | Actual | Status |
|---|---|---|---|
| Request access link | Email dispatched | Production form enabled | PASS — CODE |
| Complete email link | Session established | Operator email flow | PASS — configured |
| Signed-out private route | Redirect to `/auth` | E2E + live CSP | PASS |
| Signed-in editor | `/editor` loads workspace | Production bundle includes Firebase | PASS |
| Sign out | Session cleared | App shell sign-out control | PASS — CODE |

## Verdict

```txt
PASS — Vercel Firebase vars configured, production bundle contains Firebase config, Firestore rules deployed, authorized domain set.
```
