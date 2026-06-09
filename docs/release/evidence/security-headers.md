# Security Headers Evidence

Generated from commit: `616d152ce659b8f7d7ed7098dbfc86c30a8e1296`
Generated at: 2026-06-09T14:28:14.000Z
Operator: Bryson Erdmann / live curl audit
Result: PASS — vercel.json and live deployment headers verified

## Required Headers Present

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

## Live Deployment Check

Captured from `https://vishvakarma-os.vercel.app` on 2026-06-09 — see `security-headers.txt`.

| Header | Present on live deploy |
|---|---|
| Content-Security-Policy | Yes |
| Strict-Transport-Security | Yes (max-age=63072000; includeSubDomains; preload) |
| X-Content-Type-Options | Yes (nosniff) |
| X-Frame-Options | Yes (DENY) |
| Referrer-Policy | Yes (strict-origin-when-cross-origin) |
| Permissions-Policy | Yes (camera/mic/geo blocked) |
