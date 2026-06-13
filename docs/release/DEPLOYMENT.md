# Deployment Guide

## Vercel (production)

1. Connect GitHub repo to Vercel (`brysonandtiff-ops/vishvakarma-os`).
2. Set Supabase and Stripe env vars per [VERCEL_ENV.md](VERCEL_ENV.md).
3. Set canonical production origin env values:
   - `VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app`
   - `APP_URL=https://vishvakarma-os.app`
4. Build command: `pnpm run build` (configured in `vercel.json`).
5. Output directory: `dist/`.
6. Apply Supabase migrations: `npx supabase link --project-ref jyocvwipthswfcmvqgqe && npx supabase db push`.

The Vercel subdomain `https://vishvakarma-os.vercel.app` is a fallback/debug alias only. Use `https://vishvakarma-os.app` for launch, auth, Stripe return URLs, and valuation/operator docs.

## Required production environment

**Client (VITE_*):**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app`
- `VITE_PRICING_PAGE_ENABLED` (optional: `VITE_STRIPE_BILLING_ENABLED`)

**Server-only:**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `APP_URL=https://vishvakarma-os.app`, optional `GEMINI_API_KEY`

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
PLAYWRIGHT_BASE_URL=https://vishvakarma-os.app pnpm run test:e2e:auth
pnpm run release:gates
```

Manual checks:

1. `https://vishvakarma-os.app` loads the app.
2. `/auth` starts Google OAuth through Supabase.
3. Supabase Auth logs show `.app` as the referer after OAuth.
4. Stripe checkout success/cancel URLs return to `.app`.
5. `public/auth-capabilities.json` is regenerated after the live auth check.

## Monitoring

- Set `VITE_SENTRY_DSN` for error reporting scaffold (see `src/lib/monitoring.ts`)
- Analytics opt-in via `src/lib/analytics.ts`

## Support

- User FAQ: `docs/user/FAQ.md`
- Security: `SECURITY.md`
- Valuation handoff: `docs/handoff/HANDOFF.md`
