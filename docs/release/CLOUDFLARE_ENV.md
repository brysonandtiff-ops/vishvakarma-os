# Cloudflare Pages Environment Variables

Configure these in the Cloudflare Pages project `vishvakarma-os` for Production and Preview where required.

**Canonical production origin:** `https://vishvakarma-os.app`
**Pages origin:** `https://vishvakarma-os.pages.dev`

## Required client build variables

| Variable | Value or source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key |
| `VITE_AUTH_REDIRECT_ORIGIN` | `https://vishvakarma-os.app` |

## Required server secrets

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only RLS/admin operations |
| `STRIPE_SECRET_KEY` | Stripe server API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `STRIPE_PRICE_STUDIO_MONTHLY` | Studio price ID |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Enterprise price ID |
| `APP_URL` | `https://vishvakarma-os.app` |
| `GEMINI_API_KEY` | Optional AI designer API key |

Never prefix server secrets with `VITE_`. Vite embeds `VITE_*` values at build time, so changing them requires a new Pages deployment.

## Optional variables

- `VITE_PRICING_PAGE_ENABLED=true`
- `VITE_STRIPE_BILLING_ENABLED=true`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_AUTH_WINNER`
- `VITE_COLLAB_WS_URL`
- `VITE_SENTRY_DSN`

## Validation

```bash
pnpm run production:verify-env --strict
pnpm run auth:gates
pnpm run verify:stripe-billing --strict
pnpm run certify:cloudflare -- https://<preview>.vishvakarma-os.pages.dev
```

After updating variables, trigger a new Pages deployment and verify the exact deployed Git SHA.
