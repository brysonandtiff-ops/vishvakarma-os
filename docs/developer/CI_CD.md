# Verification and Deployment

**Product version:** v1.5.0

**Last reviewed:** 2026-11-19

**Audience:** developers and operators

## Current policy

`.github/workflows/production-certification.yml` is the sole approved workflow. It runs on pushes and pull requests targeting `main` and on manual dispatches.

The workflow binds results to the exact commit SHA and performs:

- read-only verification of hosted Supabase Auth policy;
- Chromium, Firefox, and WebKit E2E;
- accessibility and editor-performance browser audits;
- production auth-route verification;
- strict release and launch-evidence gates;
- evidence artifact upload.

Cloudflare Pages builds and hosts the app. Certification requires the exact-source immutable Pages preview, the green CI receipt, independent acceptance and the holds listed in the [release decision](../release/CURRENT_RELEASE_STATUS.md).

## Required release ladder

```bash
pnpm install --frozen-lockfile
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
pnpm run lint
pnpm run verify:ci
PLAYWRIGHT_BROWSERS=all pnpm run test:e2e
pnpm run test:e2e:a11y
pnpm run test:e2e:perf
pnpm run verify:production-auth-flow
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

For Supabase or authentication changes also run:

```bash
node scripts/setup-supabase-auth-hardening.mjs --check
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:supabase-save-reload
```

## Auth platform decision

- HaveIBeenPwned leaked-password protection must remain enabled.
- TOTP enrollment and verification must remain enabled.
- Phone MFA is intentionally disabled until an SMS provider, recovery UX, SIM-swap risk posture, and the recurring Advanced MFA Phone add-on cost are explicitly approved.
- The Supabase `auth_insufficient_mfa_options` advisor warning is therefore a documented product/cost exception, not an unreviewed control gap.

## Evidence requirements

A release evidence record must include:

- exact candidate commit SHA;
- command list and exit status;
- production or preview deployment URL;
- Supabase Auth configuration and advisor disposition;
- workflow run and uploaded artifact references;
- any skipped or unavailable checks;
- a clear PASS, FAIL, or PASS-WITH-DOCUMENTED-EXCEPTION verdict.

Do not copy a prior PASS verdict onto a newer SHA.

## Deployment

Cloudflare Pages hosts production. Use the existing protected build path and confirm the exact target and rollback deployment. See the [operations runbook](../operations/DEPLOYMENT_RUNBOOK.md).

## Key scripts

| Script | Purpose |
|---|---|
| `verify:ci` | Local CI-equivalent verification bundle |
| `test:e2e` | Browser E2E; use `PLAYWRIGHT_BROWSERS=all` for certification |
| `test:e2e:a11y` | Browser accessibility audit |
| `test:e2e:perf` | Editor browser performance audit |
| `setup:supabase-auth:hardening` | Enable and verify hosted HIBP/TOTP controls |
| `release:gates:strict` | Strict release manifest |
| `launch:evidence:strict` | Strict launch-evidence validation |
| `handoff:generate` | Regenerate handoff appendices |
| `handoff:verify` | Verify handoff completeness |
| `docs:verify` | Documentation links and staleness checks |
