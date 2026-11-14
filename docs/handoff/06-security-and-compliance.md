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

[`public/_headers`](../../public/_headers) — Cloudflare Pages static security headers:

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP

Configuration check: [`scripts/deployment/verify-cloudflare-config.mjs`](../../scripts/deployment/verify-cloudflare-config.mjs). Live HTTP check: [`scripts/deployment/verify-cloudflare-live.mjs`](../../scripts/deployment/verify-cloudflare-live.mjs). These checks must be rerun for the release candidate; the historical [security-header evidence](../release/evidence/security-headers.md) does not certify a new deployment.

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

- External analytics runtime disabled; existing consent-aware event calls do not emit third-party production telemetry ([`src/lib/analytics.ts`](../../src/lib/analytics.ts))
- Monitoring: Sentry scaffold only when `VITE_SENTRY_DSN` set ([`src/lib/monitoring.ts`](../../src/lib/monitoring.ts))
- Email: Supabase Auth OTP only — no separate email provider

## Operator security checklist

1. Apply Supabase migrations before production auth
2. Restrict Supabase/Google OAuth authorized domains
3. Rotate service role key on operator transfer
4. Review Cloudflare Access and preview visibility before handling private data
5. Review the Cloudflare [runtime configuration](../../wrangler.jsonc), [build gates](../../scripts/cloudflare-build.mjs), and [release preflight](../../scripts/deployment/release-security-preflight.mjs) before each deploy; unresolved security incident #153 blocks certification
