# Deployment Runbook

## Pre-deploy

- Apply Supabase migrations.
- Confirm Cloudflare Pages variables match [CLOUDFLARE_ENV.md](../release/CLOUDFLARE_ENV.md).
- Confirm `VITE_AUTH_REDIRECT_ORIGIN` and `APP_URL` equal `https://vishvakarma-os.app`.
- Remove legacy Firebase variables.
- Run `pnpm run verify:ci` and `pnpm run release:gates`.

## Deploy

Push the approved commit to the PR branch for a Cloudflare preview. Push the reviewed merge commit to `main` for production. Cloudflare builds with `pnpm run build` and publishes `dist/` according to `wrangler.jsonc`.

## Certify

```bash
pnpm run certify:cloudflare -- https://<preview>.vishvakarma-os.pages.dev
node scripts/deployment/verify-cloudflare-live.mjs https://vishvakarma-os.pages.dev
node scripts/deployment/verify-cloudflare-live.mjs https://vishvakarma-os.app
```

Confirm the deployed commit equals the certified SHA before promotion.

## Manual smoke

1. Production and deep routes load.
2. Google OAuth completes to `/editor`.
3. Project list, 2D editor, 3D view, save/reload, export, and Stripe portal work.
4. `/api/health` succeeds and unknown `/api/*` routes fail closed.
5. CSP, HSTS, service-worker cache policy, and API no-store policy are present.

If verification fails, follow [ROLLBACK.md](./ROLLBACK.md).
