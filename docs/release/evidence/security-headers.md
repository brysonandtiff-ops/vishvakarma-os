# Security Headers Evidence

Generated from commit: `<sha>`  
Deployment URL: `<url>`  
Generated at: `<timestamp>`  
Operator: `<name>`  
Result: `PASS / FAIL / PARTIAL`

## Purpose

Prove the deployed Vishvakarma.OS response includes production security headers and that the CSP does not break runtime behaviour.

## Local Static Check

Run:

```bash
node scripts/quality/check-vercel-security.mjs
```

| Check | Expected | Actual | Status |
|---|---|---|---|
| Static Vercel config validation | Pass |  | Pending |

## Deployed Header Capture

Run against the production or preview deployment:

```bash
curl -I <deployment-url>
```

Paste relevant headers below:

```txt
Content-Security-Policy:
Strict-Transport-Security:
X-Content-Type-Options:
X-Frame-Options:
Referrer-Policy:
Permissions-Policy:
```

## Runtime CSP Smoke

| Route | Expected | Actual | Status |
|---|---|---|---|
| `/` | App boots with no CSP-blocking console errors |  | Pending |
| `/spec-center` | Governance route loads |  | Pending |
| `/registry` | Registry route loads |  | Pending |
| `/change-requests` | Change Requests route loads |  | Pending |
| `/releases` | Releases route loads |  | Pending |
| `/audit` | Audit route loads |  | Pending |

## CSP Console Errors

```txt
<none / paste errors>
```

## Verdict

```txt
PASS / FAIL / PARTIAL — explain why.
```
