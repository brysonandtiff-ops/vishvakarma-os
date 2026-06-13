# Annex 08 — Operations and Deployment

[← Handoff index](./HANDOFF.md)

## Local development bootstrap

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
pnpm run dev
```

Dev server: `http://127.0.0.1:5173` (Vite)

Verify env: `pnpm run production:verify-env` (add `--strict` for live values)

## Build and preview

| Command | Purpose |
|---------|---------|
| `pnpm run build` | Production build → `dist/` |
| `pnpm run preview` | Preview on port 4173 |
| `pnpm run preview:e2e` | E2E build + preview |

## Vercel deployment (primary production)

| Item | Detail |
|------|--------|
| Config | [`vercel.json`](../../vercel.json) — SPA rewrite to `/index.html`, API routes excluded |
| Build | `pnpm install --frozen-lockfile` → `pnpm run build` |
| Output | `dist/` |
| Deploy script | [`scripts/deploy-vercel.sh`](../../scripts/deploy-vercel.sh) — runs `verify:ci`, requires clean git, `npx vercel --prod` |

Guide: [`docs/release/DEPLOYMENT.md`](../release/DEPLOYMENT.md)

Push env to Vercel:

```bash
pnpm run push:supabase-env-vercel
# Stripe: scripts/push-stripe-env-vercel.mjs (operator)
```

## Supabase operations

```bash
pnpm run setup:supabase-auth:full
# or: npx supabase link --project-ref jyocvwipthswfcmvqgqe && npx supabase db push
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:production-auth-flow
```

Setup guide: [`docs/release/SUPABASE_AUTH_SETUP.md`](../release/SUPABASE_AUTH_SETUP.md)

## Stripe operations

```bash
pnpm run setup:stripe          # test mode products
pnpm run setup:stripe-live     # live mode (operator)
pnpm run verify:stripe-billing
```

Guide: [`docs/release/STRIPE_SETUP.md`](../release/STRIPE_SETUP.md)

## Operator launch checklist

[`docs/release/OPERATOR_CHECKLIST.md`](../release/OPERATOR_CHECKLIST.md)

- Gates 1–8, 13: automated CI (`pnpm run release:gates`)
- Gates 9–12: manual evidence (save/load, 2D/3D parity, iPad touch, auth proof)

Evidence directory: [`docs/release/evidence/`](../release/evidence/)

## Collaboration server (optional)

Not deployed to Vercel by default:

```bash
pnpm run collab:server:dev
```

Requires `SUPABASE_SERVICE_ROLE_KEY`, `COLLAB_WS_PORT`, `ALLOWED_ORIGINS`.

## Docker alternative

[`Dockerfile`](../../Dockerfile) — multi-stage Node 20 build; serves `dist/` via `serve` on port 3000.

## Full verification before ship

```bash
pnpm run verify:ci
pnpm run test:e2e
pnpm run release:gates
pnpm run handoff:generate
pnpm run handoff:verify
```

Command reference: [`docs/release/VERIFY_COMMANDS.md`](../release/VERIFY_COMMANDS.md)

## Admin / co-owner setup

| Task | Script / doc |
|------|--------------|
| Promote Supabase admin | Supabase Dashboard or [`MIGRATION.md`](../../MIGRATION.md) |
| Co-owner entitlements | [`src/config/coOwners.ts`](../../src/config/coOwners.ts) + deploy |
| Legacy Firebase admin scripts | [`scripts/production/setup-admin.mjs`](../../scripts/production/setup-admin.mjs) — **legacy only** |

## PWA assets

```bash
pnpm run assets:pwa-icons
pnpm run setup:scene-models
```

Gate: `pnpm run pwa:gates`
