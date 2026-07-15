# Verification and Deployment

**Product version:** v1.5.0  
**Last reviewed:** 2026-07-16  
**Audience:** developers and operators

## Current policy

GitHub Actions is intentionally disabled by owner policy. Files under `.github/workflows/` are ignored and no push or pull request should be described as automatically certified by GitHub Actions.

Verification is performed from a trusted local checkout. Results must be bound to an exact commit SHA and committed under `docs/release/evidence/`. Vercel provides deployment/build status, but a green Vercel build is not a replacement for the application test and release-gate ladder.

## Required release ladder

```bash
pnpm install --frozen-lockfile
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
pnpm run lint
pnpm run verify:ci
pnpm run test:e2e
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

For Supabase or authentication changes also run:

```bash
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:production-auth-flow
pnpm run verify:supabase-save-reload
```

## Evidence requirements

A release evidence record must include:

- exact candidate commit SHA;
- command list and exit status;
- production or preview deployment URL;
- Supabase migration/advisor status when the database changed;
- any skipped, unavailable, or operator-only checks;
- a clear PASS, FAIL, or PARTIAL verdict.

Do not copy a prior PASS verdict onto a newer SHA. Historical GitHub Actions runs remain valid historical evidence only for the commits they tested.

## Deployment

Production deploys use Vercel. `pnpm run deploy:vercel` runs the local verification path and requires a clean worktree. See [operations/DEPLOYMENT_RUNBOOK.md](../operations/DEPLOYMENT_RUNBOOK.md).

## Key scripts

| Script | Purpose |
|---|---|
| `verify:ci` | Local CI-equivalent verification bundle |
| `release:gates:strict` | Strict release manifest |
| `launch:evidence:strict` | Strict launch-evidence validation |
| `handoff:generate` | Regenerate handoff appendices |
| `handoff:verify` | Verify handoff completeness |
| `docs:verify` | Documentation links and staleness checks |
| `hardening:gates` | Production security checks |
| `auth:gates` | Authentication configuration guards |
