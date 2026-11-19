# Vishvakarma.OS Cloudflare Production Certification

**Production origin:** https://vishvakarmaos.app

**Pages project:** `vishvakarma-os`

**Current decision:** [Production hold and candidate freeze](CURRENT_RELEASE_STATUS.md)

The project builds `dist/` via `node scripts/cloudflare-build.mjs`. Pages serves the SPA and routes API requests through the catch-all under `functions/api/`. Runtime compatibility is recorded in `wrangler.jsonc`.

## Bound source and deployment

Check out the intended commit with a clean working tree. Use its immutable Cloudflare Pages deployment URL. The deployment attestation requires approved Pages Read credentials, the deployment UUID and a matching source SHA. The public apex and www hosts are useful for post-deploy smoke checks.

```bash
node scripts/deployment/certify-cloudflare-release.mjs https://<deployment>.vishvakarma-os.pages.dev
```

The command checks verified GitHub closure of [security #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153) and [backup #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188), then runs repository and artifact security, Cloudflare config, types, focused regressions, production build, performance and strict release evidence. The GitHub certification workflow verifies hosted Supabase Auth settings using a read-only check.

## Live response checks

```bash
node scripts/deployment/verify-cloudflare-live.mjs https://<deployment>.vishvakarma-os.pages.dev
node scripts/deployment/verify-cloudflare-live.mjs https://vishvakarmaos.app
```

The verifier checks landing identity and security headers, deep SPA routes, `/api/health`, uncached unknown API errors and service-worker freshness. Record request origin and commit provenance alongside the results.

## Acceptance and promotion

Complete the [operator checklist](OPERATOR_CHECKLIST.md) for signed-in cloud persistence, tenant isolation, provider settings, physical devices and recoverable backups. Attach the independent evidence and get approval for the exact source. Follow the existing Cloudflare deployment and [rollback runbook](../operations/ROLLBACK.md). After promotion, validate the newly serving source, both production domains, authenticated Studio functionality and public API responses.
