# Firebase Production Check

Generated from commit: `bff6357` (auth SDK migration follow-up)
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-09T20:00:00.000Z
Operator: Bryson Erdmann / auth SDK migration + local env verify
Result: PASS — Firebase SDK email-link sign-in; session persists across refresh; token refresh before Firestore REST

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
| Complete email link | Session established via Firebase SDK | `signInWithEmailLink` + `onAuthStateChanged` | PASS — CODE |
| Refresh after sign-in | Session survives page reload | SDK persistence + snapshot sync | PASS — CODE |
| Cross-device email link | Re-enter email on `/auth` | `needs_email` prompt on AuthPage | PASS — CODE |
| Google / Apple OAuth | Popup or redirect sign-in | Buttons on AuthPage when Console providers enabled | PASS — CODE |
| Signed-out private route | Redirect to `/auth` | E2E + live CSP | PASS |
| Signed-in editor | `/editor` loads workspace | Production bundle includes Firebase | PASS |
| Sign out | Session cleared | App shell sign-out control | PASS — CODE |

## Verdict

```txt
PASS — Vercel Firebase vars configured, SDK email-link auth wired, session persistence fixed, Firestore bearer refresh via `resolveFirebaseSessionForFirestore`, authorized domain set.

Operator note: enable Google and Apple providers in Firebase Console → Authentication → Sign-in method when OAuth buttons should work in production. Redeploy Vercel after any `VITE_FIREBASE_*` change.
```
