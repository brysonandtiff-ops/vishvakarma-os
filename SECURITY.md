# Security Policy — Vishvakarma.OS

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | Yes       |
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

- **Supabase Auth** (email magic link, Google OAuth, Apple OAuth when configured)
- Private routes gated by [RouteGuard.tsx](src/components/common/RouteGuard.tsx)
- Session tokens managed by Supabase SDK; API routes verify JWT via service role ([api/_lib/verifySupabaseToken.ts](api/_lib/verifySupabaseToken.ts))

### Data access

- **Postgres Row Level Security (RLS)** on all application tables — see [supabase/migrations/20260212000003_rls_policies.sql](supabase/migrations/20260212000003_rls_policies.sql)
- Users may only read/write their own profile and billing rows
- Projects: owner + collaborator access (migration 005)
- Governance tables: authenticated read; admin write via `profiles.role = 'admin'`
- Storage bucket `materials`: public read; user-scoped write paths

### Transport and headers

Production deploys via Vercel with security headers defined in [vercel.json](vercel.json):

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

Evidence: [docs/release/evidence/security-headers.md](docs/release/evidence/security-headers.md)

### Client-side data

- Project manifests stored in Supabase Postgres under RLS-scoped `projects` table
- Local draft recovery uses `localStorage` only on the user's device when backend is unconfigured
- No secrets in client bundle — only `VITE_*` public Supabase anon key and feature flags

### Dependencies

- Run `pnpm audit` before releases
- CI enforces lint, type-check, and automated test gates

## Operator checklist

1. Apply Supabase migrations before enabling production auth (`npx supabase db push`)
2. Restrict Supabase/Google OAuth authorized domains to production URL
3. Remove legacy Firebase env vars from Vercel if still present (`VITE_FIREBASE_*`, `BACKEND_PROVIDER`)
4. Enable Vercel deployment protection for preview URLs if handling sensitive data
5. Review [docs/release/VERCEL_ENV.md](docs/release/VERCEL_ENV.md) before each production deploy
6. Rotate `SUPABASE_SERVICE_ROLE_KEY` on operator transfer

## Privacy

- Analytics (when enabled) requires explicit user opt-in via the consent banner
- Error monitoring (Sentry, when configured) strips PII from breadcrumbs
- Project data is stored in Supabase (Auth, Postgres, Storage) and Stripe for billing metadata only

## Legacy note

Firebase Admin scripts remain in `scripts/production/` for historical operator workflows. They are **not** the current production auth or data path. See [docs/CURRENT_PRODUCTION_ARCHITECTURE.md](docs/CURRENT_PRODUCTION_ARCHITECTURE.md).
