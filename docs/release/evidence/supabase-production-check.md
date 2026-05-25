# Supabase Production Check

Generated from commit: `<sha>`  
Deployment URL: `<url>`  
Generated at: `<timestamp>`  
Operator: `<name>`  
Result: `PASS / FAIL / PARTIAL`

## Purpose

Prove Vishvakarma.OS has a production-ready Supabase configuration before public launch.

## Environment Variables

| Variable | Configured in deploy host | Notes |
|---|---:|---|
| `VITE_SUPABASE_URL` | Pending |  |
| `VITE_SUPABASE_ANON_KEY` | Pending |  |

Do not paste secret values into this evidence file.

## Supabase Auth Checklist

| Check | Expected | Status | Notes |
|---|---|---|---|
| Production site URL added | Deployment URL present in Auth URL config | Pending |  |
| Localhost preview URLs configured | Local dev allowed if needed | Pending |  |
| Email link / OTP provider configured | Required if auth is enabled | Pending |  |
| Redirect URLs audited | No unknown/stale domains | Pending |  |

## Database / Migration Checklist

| Check | Expected | Status | Notes |
|---|---|---|---|
| Migrations applied | `supabase/migrations` applied to target project | Pending |  |
| Projects table exists | App can read/write project records | Pending |  |
| Specs table exists | Governance specs available | Pending |  |
| Registry table exists | Registry data available | Pending |  |
| Change requests table exists | Workflow data available | Pending |  |
| Releases table exists | Release records available | Pending |  |
| Audit logs table exists | Audit records available | Pending |  |

## RLS / Access Control Notes

```txt
Paste policy summary or verification output here. Do not include private keys.
```

## Runtime Smoke

| Action | Expected | Actual | Status |
|---|---|---|---|
| App boots with production env | No missing env crash |  | Pending |
| Save project | Record persists |  | Pending |
| Reload project | Record loads |  | Pending |
| Audit event writes | Event appears in audit log |  | Pending |

## Verdict

```txt
PASS / FAIL / PARTIAL — explain why.
```
