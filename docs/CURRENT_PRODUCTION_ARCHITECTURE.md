# Vishvakarma.OS — Current Hosting and System Architecture

**Cloudflare control-plane check:** 19 November 2026 UTC. See the [release decision](release/CURRENT_RELEASE_STATUS.md) for source IDs, public probes and acceptance evidence.

## Actual hosting — do not confuse reachability with release readiness

- **Active Cloudflare-hosted custom domain:** https://vishvakarmaos.app (and https://www.vishvakarmaos.app). Cloudflare Pages lists both custom domains as active.
- **Cloudflare Pages project:** `vishvakarma-os`. Base origin: https://vishvakarma-os.pages.dev.
- **Current custom-domain production deployment:** successful `3d003e50` deployment from **5 August 2026**, source `5a1305928ca9435e577ea2e021935452f9289a02`. This is *older* than the current development code.
- **Latest Cloudflare preview recorded on 19 November:** https://cc716a47.vishvakarma-os.pages.dev at source `6c307063e5bf6cab84344f7f629c703c1e962e5b`. The unified Studio is a subsequent local candidate.
- **Pages production branch configured in Cloudflare:** `agent/cloudflare-pages-workers-migration`; build command `node scripts/cloudflare-build.mjs`, output `dist`.
- **Older similarly spelled domain:** Cloudflare lists the hyphenated domains as deactivated. Use the apex above for sign-in, billing, and marketing links.
- **Status:** PRODUCTION/RELEASE HOLD. The live website's HTTP 200 does **not** certify signed-in workflows, RLS isolation, backups, real-device 3D or a current-source deployment.

## System design

| Function | Source of truth / supported service | Evidence limitation |
|---|---|---|
| Web application | React/TypeScript/Vite PWA, React Router, 2D/Three.js editor | The local freeze contains unified Projects and Studio. Signed-in cloud and physical-device acceptance remain open |
| Hosting and static assets | Cloudflare Pages; custom domain above | Current domain serves older source SHA |
| Authentication | Supabase Auth source with approved Google SSO and existing-account email links | Live OAuth and canonical host callback, account invitation and tenant roles require fresh verification |
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
3. Approved-user sign-in, physical iPad/Fold interaction, real 2D/3D/save/reopen, OAuth callback and live RLS proof remain outstanding. The family-admin SQL migration is still a staged source candidate.
4. Current production serves the August source SHA. The local freeze needs its own immutable preview and independent verification.
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


## November review authority

[Source-of-truth matrix](./repository/SOURCE_OF_TRUTH_20261119.md) and [release evidence](./release/evidence/REVIEW_VERIFICATION_LEDGER_20261119.md) identify the draft SHA and tested scope. Never treat a source-only migration, green preview, static mock or this dated document as approval to modify production.
