# Annex 06 — Security and Compliance

[← Handoff index](./HANDOFF.md)

## Authentication

**Production:** Supabase Auth — email magic link, Google OAuth, Apple OAuth when configured.

| Component | Path |
|-----------|------|
| Auth provider | [`src/contexts/SupabaseAuthProvider.tsx`](../../src/contexts/SupabaseAuthProvider.tsx) |
| Route protection | [`src/components/common/RouteGuard.tsx`](../../src/components/common/RouteGuard.tsx) |
| API JWT verify | [`api/_lib/verifySupabaseToken.ts`](../../api/_lib/verifySupabaseToken.ts) |
| Collab WS auth | [`server/collab/auth.ts`](../../server/collab/auth.ts) |

Auth config guard (Supabase-only, no Firebase backend dir): [`scripts/quality/check-auth-config-guard.mjs`](../../scripts/quality/check-auth-config-guard.mjs)

Setup: [`docs/release/SUPABASE_AUTH_SETUP.md`](../release/SUPABASE_AUTH_SETUP.md)

## Row Level Security (Postgres)

Migration: [`supabase/migrations/20260212000003_rls_policies.sql`](../../supabase/migrations/20260212000003_rls_policies.sql)

| Table | Policy pattern |
|-------|----------------|
| `profiles` | Own row only (`auth.uid() = id`) |
| `projects` | Owner + collaborators (updated in migration 005) |
| `specs`, `registry`, `releases`, `route_manifest` | Read: authenticated; write: `is_admin()` |
| `change_requests` | Read: authenticated; insert: self; update: owner or admin |
| `audit_logs` | Read/insert: authenticated; update/delete: admin |
| `billing` | Own row |
| `optimization_batches` | Own rows (`user_id = auth.uid()`) |

`is_admin()` checks `profiles.role = 'admin'` (not JWT user_metadata).

## Transport and headers

[`vercel.json`](../../vercel.json) — production security headers:

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP

Verified by: [`scripts/quality/check-vercel-security.mjs`](../../scripts/quality/check-vercel-security.mjs)  
Evidence: [`docs/release/evidence/security-headers.md`](../release/evidence/security-headers.md)

## Client-side secrets policy

- Only `VITE_*` public keys inlined at build time
- Server keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`) never prefixed with `VITE_`
- Template: [`.env.example`](../../.env.example)

## Local / dev bypasses

| Env var | Effect |
|---------|--------|
| `VITE_ALLOW_LOCAL_DEMO` | Bypass auth gate in DEV |
| `VITE_E2E_ALLOW_LOCAL_ACCESS` | E2E access without auth when backend unconfigured |

## External compliance claims (legal/product)

Modules with **prototype disclaimers** — do not claim certified compliance or guaranteed approvals:

- [`src/constants/prototypeDisclaimer.ts`](../../src/constants/prototypeDisclaimer.ts)
- Compliance: automated NCC **stub** checks
- Council intelligence: readiness **scoring**, not approval guarantee
- Cost intelligence: **simulated** figures for design validation

## Security policy document

[`SECURITY.md`](../../SECURITY.md) — vulnerability reporting and architecture (updated for Supabase production path).

## Privacy

- Analytics: opt-in via consent banner ([`src/lib/analytics.ts`](../../src/lib/analytics.ts))
- Monitoring: Sentry scaffold only when `VITE_SENTRY_DSN` set ([`src/lib/monitoring.ts`](../../src/lib/monitoring.ts))
- Email: Supabase Auth OTP only — no separate email provider

## Operator security checklist

1. Apply Supabase migrations before production auth
2. Restrict Supabase/Google OAuth authorized domains
3. Rotate service role key on operator transfer
4. Enable Vercel deployment protection for preview URLs if needed
5. Review [`docs/release/VERCEL_ENV.md`](../release/VERCEL_ENV.md) before each deploy
