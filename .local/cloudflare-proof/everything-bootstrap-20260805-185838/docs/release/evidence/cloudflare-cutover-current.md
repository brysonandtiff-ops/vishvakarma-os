# Cloudflare cutover — current state

Branch: `agent/cloudflare-pages-workers-migration`
Head at creation: `7146a4382ed34306f601936dc763c6e6d7995263`

## Completed in repository

- Cloudflare Pages + Pages Functions runtime implemented.
- Supabase server URL bound through `wrangler.jsonc`.
- Cloudflare Pages callback URLs added to `supabase/config.toml`.
- Live Cloudflare readiness verifier added at `scripts/deployment/verify-cloudflare-live.mjs`.
- Signed Stripe webhook verifier added at `scripts/deployment/verify-cloudflare-stripe-webhook.mjs`.
- Fail-closed PowerShell cutover runner added at `RUN_CLOUDFLARE_CUTOVER_GATES.ps1`.

## Account-side proof still required

- Confirm Cloudflare deployment for the exact latest commit is green.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` exists as a Cloudflare encrypted secret and `/api/health` returns HTTP 200 with `ok: true`.
- Push `supabase/config.toml` to project `jyocvwipthswfcmvqgqe` and complete one Pages OAuth or email-link callback.
- Configure Cloudflare Stripe secrets and price IDs.
- Run a test checkout and the harmless signed webhook probe.
- Run `RUN_CLOUDFLARE_CUTOVER_GATES.ps1` from the migration branch and retain its transcript.
- Merge PR #144 only after automated and human-session proof passes.
- Change Cloudflare production branch to `main`, redeploy, and repeat smoke checks.
- Add `vishvakarma-os.app` to Cloudflare Pages and move DNS.
- Remove the custom domain from Vercel, disconnect Git, and delete the Vercel project only after custom-domain proof passes.

## GitHub Actions blocker

The latest Production Certification jobs terminate before GitHub records any steps or log blob. This is an Actions account/runner scheduling failure, not a reported repository-test failure. The local cutover runner is the current evidence path until the GitHub runner is restored.
