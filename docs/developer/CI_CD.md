# Verification and Deployment

**Product version:** v1.5.0  
**Last reviewed:** 2026-07-16  
**Audience:** developers and operators

## Current policy

GitHub Actions is allow-listed rather than globally enabled. `.github/workflows/production-certification.yml` is the sole approved workflow and runs against every push to `main` plus manual dispatches.

The workflow binds results to the exact commit SHA and performs:

- hosted Supabase Auth hardening verification;
- Chromium, Firefox, and WebKit E2E;
- accessibility and editor-performance browser audits;
- production auth-route verification;
- strict release and launch-evidence gates;
- evidence artifact upload.

Vercel remains the deployment/build provider. A green Vercel build and a green Production Certification run are both required for a fully production-verified claim.

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
pnpm run setup:supabase-auth:hardening
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

Production deploys use Vercel. `pnpm run deploy:vercel` runs the local verification path and requires a clean worktree. See [operations/DEPLOYMENT_RUNBOOK.md](../operations/DEPLOYMENT_RUNBOOK.md).

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
