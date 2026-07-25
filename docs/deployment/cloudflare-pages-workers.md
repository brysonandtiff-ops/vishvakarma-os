# Cloudflare Pages + Workers deployment

This runbook moves Vishvakarma.OS from Vercel to Cloudflare Pages with Pages Functions while preserving the existing API security, authentication, billing, AI quota, cast, PWA, and response-header contracts.

## Migration state

- Cloudflare runtime adapter: implemented
- `/api/*` Pages Function router: implemented
- SPA fallback: implemented
- Static security and cache headers: implemented
- Worker Node.js compatibility: enabled
- DNS cutover: **not performed**

Do not change DNS until the generated `vishvakarma-os.pages.dev` deployment passes the smoke checks below.

## Runtime architecture

```text
GitHub migration branch (validation) -> GitHub main (after merge)
   |
   +-- Vite production build ----------------------> Cloudflare Pages static assets
   |                                                   |
   |                                                   +-- public/_headers
   |                                                   +-- public/_redirects
   |                                                   +-- public/_routes.json
   |
   +-- functions/api/[[path]].ts ------------------> Cloudflare Pages Functions
                                                        |
                                                        +-- Fetch-to-Node adapter
                                                        +-- existing hardened api/*.ts handlers
                                                        +-- Supabase / Stripe / Gemini
```

Only `/api/*` invokes Pages Functions. Static assets remain on Cloudflare's static delivery path.

## Cloudflare project configuration

Create a **Pages** project connected to GitHub.

For the first deployment, temporarily use the migration branch so Cloudflare can be tested without merging or changing `main`. After every preview and repository gate passes, merge pull request #144 and change the Cloudflare production branch to `main`.

| Setting | Initial validation | Final production |
|---|---|---|
| Repository | `brysonandtiff-ops/vishvakarma-os` | same |
| Production branch | `agent/cloudflare-pages-workers-migration` | `main` |
| Framework preset | Vite | Vite |
| Build command | `node scripts/vercel-build.mjs` | same |
| Build output directory | `dist` | same |
| Root directory | repository root | same |
| Node.js | `22` | `22` |
| pnpm | `9.15.0` | `9.15.0` |

`wrangler.jsonc` supplies the Pages output directory, compatibility date, and `nodejs_compat` runtime flag. The build command intentionally runs the repository's existing secret guard, lint, hardening gates, focused regressions, full test suite, production build, artifact scan, and performance budgets.

## Build-time public variables

Configure these for both Preview and Production as appropriate:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app
VITE_PRICING_PAGE_ENABLED=true
VITE_STRIPE_BILLING_ENABLED=true
```

Optional public variables:

```text
VITE_COLLAB_WS_URL
VITE_SENTRY_DSN
```

Never place service-role, Stripe secret, Gemini secret, or webhook secret values in a `VITE_` variable.

## Runtime secrets and server variables

Add these through **Workers & Pages -> project -> Settings -> Variables and Secrets**.

Required for authenticated API and health readiness:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APP_URL=https://vishvakarma-os.app
```

Required when Stripe billing is enabled:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STUDIO_MONTHLY
STRIPE_PRICE_ENTERPRISE_MONTHLY
```

Optional AI and collaboration configuration:

```text
GEMINI_API_KEY
GEMINI_MODEL
COLLAB_WS_URL
VITE_COLLAB_WS_URL
```

Cloudflare bindings are copied into `process.env` by the Pages API router so the existing server modules retain their current environment contract.

## Pre-DNS verification

Run these checks against the generated `https://vishvakarma-os.pages.dev` address:

1. `/` loads without a redirect loop.
2. `/auth`, `/pricing`, `/profile`, and another deep SPA route return the application rather than a Cloudflare 404.
3. `/api/health` returns JSON and HTTP `200` when Supabase server variables are configured.
4. `/api/does-not-exist` returns a secured JSON `404`.
5. An unauthenticated protected API call returns `401`.
6. Supabase login and callback complete on the Pages address.
7. Stripe test checkout creates a Checkout Session.
8. Stripe test webhook signature verification succeeds.
9. `sw.js` is served with `Service-Worker-Allowed: /` and a revalidation cache policy.
10. Hashed `/assets/*` responses use immutable caching.
11. The same branch passes the full repository production gate from a working runner.

## Supabase preparation

Before testing authentication, add these redirect URLs to the Supabase Auth URL configuration:

```text
https://vishvakarma-os.pages.dev/**
https://*.vishvakarma-os.pages.dev/**
https://vishvakarma-os.app/**
```

Keep the Vercel fallback URLs temporarily during migration so rollback remains possible.

## Stripe preparation

Create a temporary Stripe webhook endpoint for:

```text
https://vishvakarma-os.pages.dev/api/stripe/webhook
```

Use its signing secret as the Cloudflare `STRIPE_WEBHOOK_SECRET`. Keep the old Vercel endpoint enabled until Cloudflare webhook delivery is verified. After the custom domain is live, create or switch to:

```text
https://vishvakarma-os.app/api/stripe/webhook
```

## Merge and production-branch transition

After the branch deployment passes every check:

1. Merge pull request #144 into `main`.
2. Change the Cloudflare Pages production branch from `agent/cloudflare-pages-workers-migration` to `main`.
3. Confirm the resulting `main` deployment uses the merged commit.
4. Re-run the complete smoke checklist before adding the custom domain.

## Custom-domain cutover

Only after the `main` Pages deployment passes every smoke check:

1. Open the Pages project and select **Custom domains**.
2. Add `vishvakarma-os.app`.
3. Add `www.vishvakarma-os.app` if it is used.
4. Apply the DNS or nameserver changes Cloudflare requests.
5. Confirm HTTPS is active.
6. Re-run the complete smoke checklist against the custom domain.
7. Confirm Supabase callbacks and Stripe webhook deliveries use the custom domain.
8. Remove obsolete Vercel DNS records only after the production checks pass.

## Rollback

Until the final step, Vercel remains the rollback target. If a production issue appears:

1. Restore the previous DNS records.
2. Re-enable the previous Stripe webhook endpoint if it was disabled.
3. Keep the Cloudflare Pages project available for diagnosis.
4. Do not delete either deployment until authentication, billing, and webhook evidence is captured.

## Files introduced by the migration

```text
cloudflare/vercelHandlerAdapter.ts
functions/api/[[path]].ts
public/_headers
public/_redirects
public/_routes.json
wrangler.jsonc
```

The Vercel handlers remain in place during migration. This keeps rollback possible and avoids duplicating security-sensitive business logic.
