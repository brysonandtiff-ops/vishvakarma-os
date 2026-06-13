# Vishvakarma.OS — Current Production Architecture

**Status date:** 2026-06-13  
**Canonical production URL:** https://vishvakarma-os.app  
**Vercel fallback URL:** https://vishvakarma-os.vercel.app  
**Purpose:** Current-state addendum for README, software inventory, valuation, and technical due-diligence reviews.

---

## Executive status

Vishvakarma.OS is now tracking a **Supabase-first / Supabase-only production architecture** for runtime auth, Postgres data, storage, billing entitlements, and collaboration metadata.

Earlier v1.2.x work included a Firebase + Supabase dual-backend migration path. That work remains valuable as migration history and portability evidence, but it should not be described as the active production architecture unless the Firebase path is intentionally restored.

Use this document to supersede older references that say the production system is runtime-selectable between Firebase and Supabase.

---

## Current production backend

| Layer | Current production path | Notes |
|---|---|---|
| Authentication | Supabase Auth | Email link and Google OAuth cutover work is active. |
| Primary data | Supabase Postgres | Projects, governance records, billing state, optimization history, profiles. |
| Storage | Supabase Storage | Materials and uploaded asset storage path. |
| Billing entitlement writes | Supabase-backed API routes | Stripe remains the billing provider. |
| Collaboration metadata | Supabase tables / app server authorization | Yjs/WebSocket presence remains preview/scaffolded. |
| Firebase | Legacy/migration support only | Firestore export/import and historical auth config remain useful for migration, not live architecture claims. |

---

## Canonical origin rules

Use `https://vishvakarma-os.app` for:

- production links in investor, operator, and valuation docs
- `APP_URL`
- `VITE_AUTH_REDIRECT_ORIGIN`
- Supabase Site URL
- Stripe checkout success/cancel return URLs
- launch evidence and auth proof after retesting

Use `https://vishvakarma-os.vercel.app` only as a Vercel fallback/debug alias or preview-compatible redirect origin.

---

## Current operator commands

```bash
pnpm install --frozen-lockfile
pnpm run hardening:gates
pnpm run auth:gates
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
pnpm run test
pnpm run build
```

Supabase setup / cutover helpers:

```bash
pnpm run setup:supabase-auth
pnpm run setup:supabase-auth:full
pnpm run push:supabase-env-vercel
node scripts/migration/export-supabase.mjs
pnpm run migration:import-supabase -- --in=migration/your-legacy-export.json
```

Stripe helpers:

```bash
pnpm run setup:stripe
pnpm run setup:stripe-live
pnpm run setup:stripe-live:cli
pnpm run verify:stripe-billing
```

---

## Documentation wording rules

Use this wording for current production status:

```text
Current v1.2.x production architecture is consolidated around Supabase for auth, Postgres persistence, storage, billing entitlement state, and collaboration metadata. Firebase migration utilities remain in the repository as historical portability and data-migration support. The canonical production origin is https://vishvakarma-os.app; the Vercel subdomain is a fallback/debug alias.
```

Avoid this wording for current production status:

```text
runtime-selectable dual backend
current Firebase production backend
Firebase-only production
Firebase/Supabase dual cloud is the live architecture
vishvakarma-os.vercel.app is the canonical production origin
```

It is still fair to mention the historical engineering effort:

```text
Earlier v1.2.x releases implemented Firebase/Supabase dual-backend migration paths. Those migration utilities are retained for portability and archive recovery.
```

---

## Due-diligence impact

This change is a **production simplification**, not a product-value reduction.

Positive signals:

- Fewer runtime provider branches.
- Simpler operator environment matrix.
- Supabase Auth, Postgres, Storage, and RLS become the primary production control plane.
- Firebase migration scripts remain as portability evidence.
- Stripe, Vercel, React, Three.js, Gemini, and Yjs remain unchanged as external integration surfaces.

Caution for valuation documents:

- Do not count Firebase and Supabase as two live production backends.
- Count Firebase work as historical migration tooling and engineering depth.
- Count Supabase as the active production backend.

---

## Manual smoke checklist

After backend/auth changes, manually verify:

1. `/auth` loads and shows Supabase auth status on `https://vishvakarma-os.app`.
2. Google OAuth completes and redirects to `/editor` from the canonical domain.
3. `/projects` lists cloud/local project state correctly.
4. New project save/load works.
5. Stripe checkout and portal routes resolve with valid auth and return to the canonical domain.
6. `/editor` loads 2D + 3D surfaces.
7. iPad Safari can sign in, open editor, and use terrain/tools.
8. PWA install/home-screen flow does not serve stale auth shell.

---

## Related files

| Area | Files |
|---|---|
| Supabase auth | `src/backend/supabase/`, `scripts/setup-supabase-auth-providers.mjs` |
| Supabase schema | `supabase/migrations/`, `scripts/verify-supabase-schema.mjs` |
| Billing | `api/stripe/`, `api/_lib/billingSupabase.ts`, `scripts/verify-stripe-billing.mjs` |
| Migration | `scripts/migration/export-supabase.mjs`, `scripts/migration/import-supabase.mjs`, `scripts/migration/validate-migration.mjs` |
| Production hardening | `scripts/quality/check-production-hardening.mjs` |
| Vercel | `vercel.json`, `docs/release/VERCEL_ENV.md` |

---

## Maintenance

Update this file whenever the active production backend changes, auth provider flow changes, billing entitlement write path changes, or canonical production origin changes.
