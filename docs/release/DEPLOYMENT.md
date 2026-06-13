# Deployment Guide

## Vercel (production)

1. Connect GitHub repo to Vercel (`brysonandtiff-ops/vishvakarma-os`)
2. Set Supabase and Stripe env vars per [VERCEL_ENV.md](VERCEL_ENV.md)
3. Build command: `pnpm run build` (configured in `vercel.json`)
4. Output directory: `dist/`
5. Apply Supabase migrations: `npx supabase link --project-ref jyocvwipthswfcmvqgqe && npx supabase db push`

### Required production environment

**Client (VITE_*):**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_ORIGIN` (e.g. `https://vishvakarma-os.vercel.app`)
- `VITE_PRICING_PAGE_ENABLED` (optional: `VITE_STRIPE_BILLING_ENABLED`)

**Server-only:**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `APP_URL`, optional `GEMINI_API_KEY`

Remove deprecated Firebase vars: `VITE_FIREBASE_*`, `VITE_BACKEND_PROVIDER`, `BACKEND_PROVIDER`.

## Deploy script

```bash
pnpm run deploy:vercel
```

Runs `verify:ci` and requires a clean git tree before `npx vercel --prod`.

See also [docs/handoff/08-operations-and-deployment.md](../handoff/08-operations-and-deployment.md).

## Post-deploy verification

```bash
pnpm run production:verify-env --strict
pnpm run verify:supabase-schema:live
pnpm run verify:production-auth-flow
PLAYWRIGHT_BASE_URL=https://vishvakarma-os.vercel.app pnpm run test:e2e:auth
pnpm run release:gates
```

## Monitoring

- Set `VITE_SENTRY_DSN` for error reporting scaffold (see `src/lib/monitoring.ts`)
- Analytics opt-in via `src/lib/analytics.ts`

## Support

- User FAQ: `docs/user/FAQ.md`
- Security: `SECURITY.md`
- Valuation handoff: `docs/handoff/HANDOFF.md`
