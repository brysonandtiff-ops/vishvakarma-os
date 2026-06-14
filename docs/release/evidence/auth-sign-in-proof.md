# Auth Sign-In Proof

Generated from commit: `44a5863faf32b1f14175f69968ac0d2f6dce1236` (canonical-domain auth cleanup)
**Canonical deployment URL:** https://vishvakarma-os.app  
**Vercel fallback URL:** https://vishvakarma-os.vercel.app  
Generated at: 2026-06-14T07:00:00.000Z  
Operator: Cursor agent / live auth flow verification  
Result: **PASS** — Supabase Google OAuth verified on canonical `.app` origin; email OTP non-blocking for v1.2.0 launch

## Production sign-in path

| Path | Status | Notes |
|------|--------|-------|
| Google OAuth | **Production** | Primary/winner sign-in path |
| Email OTP / magic link | Configured | Not part of v1.2.0 public launch path until separately verified (OTP smoke returns 422 for test user) |

Public manifest: [`/auth-capabilities.json`](https://vishvakarma-os.app/auth-capabilities.json) — `customDomainAuthRetest: "passed"`.

## Live auth flow verification (2026-06-14)

### Automated pre-checks

| Check | Command | Result | Notes |
|---|---|---|---|
| Supabase auth smoke (canonical) | `PRODUCTION_URL=https://vishvakarma-os.app pnpm run test:supabase-auth:full` | PASS | Google config + liveSignIn; domain retest passed |
| Production OAuth redirect (3 browsers) | `PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth pnpm run verify:production-auth-flow` | PASS | 15/15 — Google button visible; redirect to `accounts.google.com`; no production auth console errors |
| Auth config guard | `pnpm run auth:gates` | PASS | Supabase wiring + canonical `site_url` guarded |
| Supabase config push | `npx supabase config push --yes` | PASS | Remote `site_url` updated to `https://vishvakarma-os.app` |

### Operator accept-path steps

1. Incognito → `https://vishvakarma-os.app/editor`
2. Confirm redirect to `/auth`
3. Click **Continue with Google** → complete consent
4. Expect final URL: `https://vishvakarma-os.app/editor`
5. Refresh — session persists; sign out → `/auth`

Script: `pnpm run verify:live-auth-flow` (automated gate + deny). Interactive accept: `pnpm run verify:live-auth-flow:interactive`.

## Supabase URL configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://vishvakarma-os.app` |
| Redirect URLs | `.app/auth`, `.app/editor`, `.app/**`, Vercel fallback aliases, localhost dev |
| Source of truth | `supabase/config.toml` |

## Email OTP note (Option B — launch scope)

Email OTP is configured in Supabase but **not** the v1.2.0 public launch sign-in path. Google OAuth is the production sign-in path until OTP is separately verified with a real smoke-test user (`SUPABASE_AUTH_TEST_EMAIL` + `SUPABASE_AUTH_SMOKE_CREATE_USER=true`).

## Historical Firebase evidence

Earlier sections referencing Firebase `createAuthUri` and `vishvakarma-os.vercel.app` as the canonical origin are **historical** (v1.1 dual-backend era). Do not use for current production status.
