# Vishvakarma.OS — Current Hosting and System Architecture

**Verified:** 15 November 2026 (Australia/Perth). This document supersedes older host/operator statements. Historical release, incident and provider records remain in Git history and archived documentation.

## Actual hosting — do not confuse reachability with release readiness

- **Active Cloudflare-hosted custom domain:** https://vishvakarmaos.app (and https://www.vishvakarmaos.app). Both returned HTTPS 200; Cloudflare Pages lists the custom domains as active.
- **Cloudflare Pages project:** `vishvakarma-os`. Base origin: https://vishvakarma-os.pages.dev.
- **Current custom-domain production deployment:** successful `3d003e50` deployment from **5 August 2026**, source `5a1305928ca9435e577ea2e021935452f9289a02`. This is *older* than the current development code.
- **Latest successful verified Cloudflare preview at review time:** https://2a32718a.vishvakarma-os.pages.dev — deployed 13 November 2026 from `5c66a6604706282e0668c2b07d7a395e2d8570b7`, existing PR #208 branch `codex/production-readiness-20261113`.
- **Pages production branch configured in Cloudflare:** `agent/cloudflare-pages-workers-migration`; build command `node scripts/cloudflare-build.mjs`, output `dist`.
- **Older similarly spelled domain:** the hyphenated .app address returned HTTP 404, is not a supported current production origin and must not be used for new sign-in, billing, proof or marketing links.
- **Status:** PRODUCTION/RELEASE HOLD. The live website's HTTP 200 does **not** certify signed-in workflows, RLS isolation, backups, real-device 3D or a current-source deployment.

## System design

| Function | Source of truth / supported service | Evidence limitation |
|---|---|---|
| Web application | React/Vite PWA with React Router and 2D/Three.js editor | Current uncommitted UI/walk changes have not been deployed |
| Hosting and static assets | Cloudflare Pages; custom domain above | Current domain serves older source SHA |
| Authentication | Supabase Auth, Google-first, URL allowlist | Live OAuth and canonical host callback require fresh verification |
| Data | Supabase Postgres and RLS | Signed-in tenant isolation is NOT VERIFIED |
| Uploads | Supabase Storage | Live signed-in access not proven |
| Billing | Server-only Stripe integration and Supabase entitlements | Stripe return URLs and webhook need new-domain verification |
| Collaboration | Authorized WebSocket app server | Only explicit Cloudflare origins should be allowed by default |
| Archived migrations | Firebase and former hosts | Historical evidence only; not an authorized live fallback |

## Canonical origin contract

Configure `https://vishvakarmaos.app` for `APP_URL`, `VITE_AUTH_REDIRECT_ORIGIN`, Google/Supabase approved redirect locations and Stripe checkout/billing return destinations **only after** verifying providers and authorizing the live configuration change. Source templates and test fixtures are not proof of deployed provider settings.

The `https://vishvakarma-os.pages.dev` origin is the Cloudflare Pages default. Immutable preview deployment URLs must be separately source-SHA verified; no arbitrary external host is allowed.

Never admit retired hosting origins into collaboration CORS or OAuth allowlists by default. The old host and old release reports remain evidence in Git history; they are not operational fallbacks.

## Security and release blockers

1. Security incident **#153 remains open**.
2. Backup/recovery issue **#188 remains open**.
3. Signed-in OAuth/cloud persistence/RLS and actual Android phone walkthrough proof are outstanding.
4. Current production custom domain is on an August source SHA, not the November PR or local uncommitted changes.
5. Cloudflare production changes, billing changes, DNS cutovers, provider secrets, paid compute and PR merge require independent authority. No production release was performed in this update.

## Verification without deployment

Run on the exact candidate checkout with an approved executor:

```bash
pnpm run auth:gates
pnpm run cloudflare-only:gates
pnpm run test:routes
pnpm run lint:types
pnpm run verify:ci
```

Use `scripts/deployment/verify-cloudflare-live.mjs`, `scripts/deployment/certify-cloudflare-release.mjs`, and their explicit safeguards only after ensuring their actual live prerequisites and approvals. Don't treat a static gate or successful HTML response as a production certificate.

**Current operating runbook:** [Release deployment](release/DEPLOYMENT.md) and [Cloudflare production certification](release/CLOUDFLARE_PRODUCTION_CERTIFICATION.md).
