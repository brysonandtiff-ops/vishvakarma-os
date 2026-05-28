# Firebase Production Check

Generated from commit: `<sha>`  
Deployment URL: `<url>`  
Generated at: `<timestamp>`  
Operator: `<name>`  
Result: `PASS / FAIL / PARTIAL`

## Purpose

Prove Vishvakarma.OS has production-ready Firebase Authentication before public launch.

Auth is Firebase-first. Supabase remains the data backend for persistence, registry, releases, and audit logs.

## Environment Variables

| Variable | Configured in deploy host | Notes |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Pending | Required |
| `VITE_FIREBASE_AUTH_DOMAIN` | Pending | Required |
| `VITE_FIREBASE_PROJECT_ID` | Pending | Required |
| `VITE_FIREBASE_APP_ID` | Pending | Required |
| `VITE_FIREBASE_STORAGE_BUCKET` | Pending | Optional |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Pending | Optional |

Do not paste secret values into this evidence file.

## Firebase Auth Checklist

| Check | Expected | Status | Notes |
|---|---|---|---|
| Email link sign-in enabled | Passwordless provider active | Pending | Firebase console > Authentication > Sign-in method |
| Authorized domains | Production + preview URLs listed | Pending | Include Vercel deployment domain |
| Redirect URL | `window.location.origin` allowed | Pending | Required for email-link completion |
| `/auth` renders sign-in form | Submit enabled when configured | Pending | Disabled in local-only mode |

## Runtime Smoke

| Action | Expected | Actual | Status |
|---|---|---|---|
| Request access link | Email dispatched |  | Pending |
| Complete email link | Session established |  | Pending |
| Signed-out private route | Redirect to `/auth` |  | Pending |
| Signed-in editor | `/` loads workspace |  | Pending |
| Sign out | Session cleared |  | Pending |

## Verdict

```txt
PASS / FAIL / PARTIAL — explain why.
```
