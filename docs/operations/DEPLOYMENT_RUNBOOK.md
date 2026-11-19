# Vishvakarma.OS — Cloudflare-Only Operations Runbook

**Checked:** 19 November 2026 UTC. **Current action: HOLD production.**

The canonical Cloudflare Pages domain is https://vishvakarmaos.app; `www.vishvakarmaos.app` is active. Project `vishvakarma-os` uses the configured Pages production branch `agent/cloudflare-pages-workers-migration`. The [release decision](../release/CURRENT_RELEASE_STATUS.md) records the August production deployment, November preview, and local Studio freeze.

## Operator checks (read-only first)

- [ ] Confirm exact Git SHA, existing worktree/branch and owner of any active PR.
- [ ] Confirm Cloudflare's actual project, domain validation, and latest **production** and **preview** deployment SHAs separately.
- [ ] Confirm security issue #153 and backup issue #188 are closed and independently proven (both were open as reviewed).
- [ ] Confirm authorised zero-cost runner and cloud quotas; never enable paid GitHub Actions or compute implicitly.
- [ ] Check `APP_URL`, `VITE_AUTH_REDIRECT_ORIGIN`, approved Google/Supabase callback URLs and Stripe return URLs without logging secrets.
- [ ] Run exact-source tests, auth/RLS checks, PWA production build, accessibility/mobile checks and independently collected visual proofs.
- [ ] Obtain explicit owner acceptance for each real UI screen.

```bash
pnpm run cloudflare-only:gates
pnpm run auth:gates
pnpm run lint:types
pnpm run test:routes
pnpm run verify:ci
```

**Important:** These commands use existing local scripts and may require environment prerequisites. Never report a check as passed if it could not run, timed out or checked a different SHA.

## Deployment and rollback

No deployment or DNS mutation is authorized by this runbook. After required gates and approval, use only the existing Cloudflare project, its source-bound build route and S.I.R.E. Cloudflare Steward. Independent read-back must compare the served artifact to the exact source SHA. Preserve all prior proof, recovery files and related PR ownership.

For a failed future release, use [rollback instructions](ROLLBACK.md) under independent authorization. Do not force-push, mass-delete deployment history or move production to an unverified branch.

See [current architecture](../CURRENT_PRODUCTION_ARCHITECTURE.md) and [release deployment guide](../release/DEPLOYMENT.md).
