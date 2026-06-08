# Security Policy — Vishvakarma.OS

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | Yes       |
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Email security reports to the project owner (see repository maintainer contact). Do not open public issues for undisclosed vulnerabilities.

Include:

- Description and impact
- Steps to reproduce
- Affected version / commit
- Suggested fix (optional)

We aim to acknowledge reports within 5 business days.

## Security architecture

### Authentication

- Firebase Authentication (email link, Google, Apple when configured)
- Private routes gated by [RouteGuard.tsx](src/components/common/RouteGuard.tsx)
- Session tokens managed by Firebase SDK; no custom JWT storage in localStorage

### Data access

- Firestore security rules: [firestore.rules](firestore.rules)
- Users may only read/write their own project documents
- Governance collections require authenticated users with appropriate roles

### Transport and headers

Production deploys via Vercel with security headers defined in [vercel.json](vercel.json):

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

Evidence: [docs/release/evidence/security-headers.md](docs/release/evidence/security-headers.md)

### Client-side data

- Project manifests stored in Firestore under user-scoped paths
- Local draft recovery uses `localStorage` only on the user's device
- No secrets in client bundle — only `VITE_*` public Firebase config keys

### Dependencies

- Run `pnpm audit` before releases
- CI enforces lint, type-check, and automated test gates

## Operator checklist

1. Deploy Firestore rules before enabling production auth
2. Restrict Firebase API key to authorized domains in Firebase Console
3. Remove legacy Supabase keys from Vercel if still present
4. Enable Vercel deployment protection for preview URLs if handling sensitive data
5. Review [docs/release/VERCEL_ENV.md](docs/release/VERCEL_ENV.md) before each production deploy

## Privacy

- Analytics (when enabled) requires explicit user opt-in via the consent banner
- Error monitoring (Sentry, when configured) strips PII from breadcrumbs
- Project data is not shared with third parties except configured Firebase/Google infrastructure
