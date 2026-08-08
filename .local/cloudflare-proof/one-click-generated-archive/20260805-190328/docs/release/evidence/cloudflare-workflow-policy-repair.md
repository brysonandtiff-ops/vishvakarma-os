# Cloudflare workflow policy repair

- Branch: `agent/cloudflare-pages-workers-migration`
- Repair head: `1f704117e78a23ce49d2bc9455870b710c0df0f9`
- Date: 2026-08-01

## Failure

Cloudflare's production build correctly failed `src/test/releaseGateHardening.test.ts` because three executable GitHub Actions workflows were present while the repository policy permits exactly one audited workflow.

Unexpected workflows:

- `.github/workflows/vercel-production-redeploy.yml`
- `.github/workflows/verify-all.yml`

## Repair

- Removed the obsolete Vercel redeploy workflow.
- Removed the duplicate Verify All workflow.
- Kept `.github/workflows/production-certification.yml` as the single executable workflow.
- Updated `.github/workflows/README.md` to describe Cloudflare Pages Git deployment while retaining the fail-closed certification policy.

## Expected result

The release-hardening workflow allow-list assertion now sees only `production-certification.yml`. This closes the reported Cloudflare test failure without weakening the test or broadening the workflow allow-list.
