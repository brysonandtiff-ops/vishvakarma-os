# Vishvakarma.OS Cloudflare Production Certification

This document defines the fail-closed release path for Cloudflare Pages production.

## Canonical architecture

- Production application: `https://vishvakarma-os.app`
- Cloudflare Pages project: `vishvakarma-os`
- Static output: `dist/`
- Dynamic API surface: `functions/api/[[path]].ts`
- Existing hardened API handlers remain the implementation source of truth.
- `wrangler.jsonc` is the repository source of truth for Pages runtime compatibility.

## Required repository evidence

The `Cloudflare Production Certification` workflow must pass on the exact release commit:

1. locked dependency install
2. Cloudflare configuration audit
3. application + Pages runtime typecheck
4. unit/integration suite
5. production build
6. emitted `_headers` and `_routes.json` verification

## Required live evidence

For the Cloudflare preview URL, run:

```bash
node scripts/deployment/verify-cloudflare-live.mjs https://<preview>.vishvakarma-os.pages.dev
```

The verifier requires:

- landing page identity
- deep SPA route recovery
- secure production `/api/health`
- fail-closed unknown API routing
- no-store API caching
- service-worker freshness policy
- browser security headers

## Promotion rule

Do not merge the certification PR until both GitHub CI and the Cloudflare preview deployment are green. After merge, rerun the live verifier against the production Pages URL and the canonical custom domain before retiring the Vercel rollback origin.
