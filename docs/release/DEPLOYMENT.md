# Vishvakarma.OS — Cloudflare Pages Deployment Guide

**Updated:** 19 November 2026 UTC. **Release state: HOLD.** See the [freeze and release evidence](CURRENT_RELEASE_STATUS.md).

## Established Cloudflare deployment

- **Production domain:** https://vishvakarmaos.app — resolves through Cloudflare Pages.
- **WWW:** https://www.vishvakarmaos.app.
- **Project:** `vishvakarma-os`; default origin https://vishvakarma-os.pages.dev.
- **Current Pages production branch:** `agent/cloudflare-pages-workers-migration`.
- **Verified build configuration:** `node scripts/cloudflare-build.mjs`, output `dist`. `wrangler.jsonc` is the project-local Cloudflare configuration.
- **Current custom-domain source:** the August 2026 deployment SHA `5a1305928ca9435e577ea2e021935452f9289a02`, not the newer source.
- **Latest successful preview observed:** https://cc716a47.vishvakarma-os.pages.dev from `6c307063e5bf6cab84344f7f629c703c1e962e5b` (19 November 2026 UTC). The Studio freeze requires a separate source-matched preview.
- Old domain/config references in earlier records are historical; no retired provider is an authorized deploy origin.

## Preconditions for any future deployment

1. Confirm exact source HEAD, active worktree, dirty changes, existing PR ownership and active S.I.R.E. authorization. Do not create a competing branch/PR or rewrite history.
2. Review source provenance, check costs and make sure no paid feature or build quota is being enabled without explicit approval.
3. Resolve or independently clear **security incident #153** and **recovery/backup #188** before production promotion.
4. Verify Supabase provider URL configuration, service bindings, Google OAuth return destinations, tenant-isolation/RLS, billing return URLs and recovery. Do **not** echo or commit secrets.
5. Run applicable source/type, test, security, PWA, signed-in browser, cross-device and exact-source-evidence checks. A local PWA-disabled diagnostic build is **not** production build proof.
6. Perform any permitted preview update only through the existing protected Cloudflare/GitHub route. Independently inspect the immutable preview URL and actual deployed SHA, then obtain the owner's visual sign-off. No manual production cutover by default.

## Environment templates (not proof of live settings)

**Client:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarmaos.app`.

**Server-only:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe credentials where actually required, `APP_URL=https://vishvakarmaos.app`.

Set Cloudflare Pages environment bindings using the approved secure controls, not source files. The local `.env.example` is a non-secret template. Do not broaden authentication permissions to make tests pass.

## Current read-only checks

```bash
pnpm run cloudflare-only:gates
pnpm run auth:gates
pnpm run test:routes
pnpm run lint:types
pnpm run docs:verify
```

Existing release-verification scripts are documented in [Cloudflare production certification](CLOUDFLARE_PRODUCTION_CERTIFICATION.md). The certification preflight blocks release on an open or unverifiable security issue or backup issue. Strict gates and independent device and cloud acceptance follow.

## Manual acceptance after authorization (not yet performed)

Check `/`, `/auth`, `/projects`, `/editor`, `/3d-room`, Google sign-in/sign-out, project save/reopen, tenant isolation, Stripe return URLs, mobile controls, genuine screenshot/video and PWA install/restart. Attach actual SHA-bound evidence before owner sign-off.

**Rollback:** Preserve current Cloudflare production deployment and the existing draft PR. Use the audited [rollback guidance](../operations/ROLLBACK.md) only through an authorized deployment owner after the exact target is confirmed.

Do not infer a production release from DNS, CDN response 200, a passing unit test or a preview deployment.
