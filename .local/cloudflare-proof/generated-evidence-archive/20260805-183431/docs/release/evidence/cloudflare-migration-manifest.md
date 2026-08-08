# Cloudflare migration evidence manifest

The migration branch prepares Vishvakarma.OS for Cloudflare Pages and Pages Functions without changing production DNS.

## Preserved production contracts

- Vite output remains `dist`.
- Existing hardened `api/*.ts` handlers remain the source of truth.
- `/api/*` is the only path that invokes Pages Functions.
- Stripe webhook request bytes remain raw for signature verification.
- Supabase bearer verification and service-role access remain server-only.
- Existing endpoint method, authentication, body-size, cache, and generic-error policies remain active.
- Existing PWA, asset cache, CSP, HSTS, and browser security headers are translated to Cloudflare Pages configuration.
- SPA deep routes fall back to `index.html` while API routes remain excluded from that fallback.

## Fail-closed cutover policy

Production DNS must remain unchanged until:

1. GitHub production gates pass on the migration pull request.
2. The generated `pages.dev` deployment passes health, auth, billing, webhook, deep-route, and PWA smoke checks.
3. Cloudflare runtime secrets are configured.
4. Supabase redirect URLs and a Stripe test webhook endpoint include the Pages deployment.

The migration keeps Vercel handlers and aliases available so rollback remains possible during validation.
