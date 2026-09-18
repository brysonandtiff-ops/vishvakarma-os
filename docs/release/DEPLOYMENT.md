# Deployment Guide

## Cloudflare Pages production

1. Keep the GitHub repository connected to the Cloudflare Pages project `vishvakarma-os`.
2. Configure Supabase, Stripe, and optional AI variables per [CLOUDFLARE_ENV.md](CLOUDFLARE_ENV.md).
3. Keep `VITE_AUTH_REDIRECT_ORIGIN` and `APP_URL` set to `https://vishvakarma-os.app`.
4. Use `pnpm install --frozen-lockfile` and `pnpm run build`; publish `dist/`.
5. Keep `wrangler.jsonc`, `public/_headers`, and `public/_routes.json` as the deployment contract.
6. Apply Supabase migrations before promotion.

Cloudflare Pages builds pull requests as previews and `main` as production. The canonical custom domain remains `https://vishvakarma-os.app`.

## Required production environment

Client variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_REDIRECT_ORIGIN`, and enabled feature flags.

Server-only variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets and price IDs, `APP_URL`, and optional `GEMINI_API_KEY`.

Never expose server-only values with a `VITE_` prefix. Remove deprecated Firebase variables.

## Certification

```bash
pnpm run verify:ci
pnpm run certify:cloudflare -- https://<preview>.vishvakarma-os.pages.dev
```

After merge, rerun live verification against both the production Pages URL and custom domain:

```bash
node scripts/deployment/verify-cloudflare-live.mjs https://vishvakarma-os.pages.dev
node scripts/deployment/verify-cloudflare-live.mjs https://vishvakarma-os.app
```

The certified SHA must match the Cloudflare deployment commit.

## Post-deploy verification

```bash
pnpm run production:verify-env --strict
pnpm run verify:supabase-schema:live
pnpm run verify:production-auth-flow
PLAYWRIGHT_BASE_URL=https://vishvakarma-os.app pnpm run test:e2e:auth
pnpm run release:gates
```

Manually confirm OAuth, 2D/3D editing, persistence, Stripe return URLs, and Cloudflare security headers.
