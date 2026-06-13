# Vishvakarma.OS

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — with a strict governance operating system built in.**

[![Production](https://img.shields.io/badge/production-v1.2.0%20live-brightgreen)](https://vishvakarma-os.app)
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Supabase-informational)]()
[![Gates](https://img.shields.io/badge/release%20gates-13%2F13%20strict-blueviolet)]()
[![UI](https://img.shields.io/badge/UI-gold%20workstation-blueviolet)]()

---

## Current production status

**Version:** v1.2.0  
**Canonical production URL:** [vishvakarma-os.app](https://vishvakarma-os.app)  
**Vercel fallback URL:** [vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app)  
**Current backend:** Supabase-first / Supabase-only production path for auth, Postgres persistence, storage, billing entitlement state, and collaboration metadata.

Earlier v1.2.x work implemented Firebase/Supabase dual-backend migration paths. Those Firebase files and migration utilities remain useful for archive recovery and portability evidence, but current production docs should treat Supabase as the active runtime backend unless a later commit explicitly restores Firebase runtime selection.

Current-state addendum: [`docs/CURRENT_PRODUCTION_ARCHITECTURE.md`](docs/CURRENT_PRODUCTION_ARCHITECTURE.md)

**Valuation / due diligence handoff:** [`docs/handoff/HANDOFF.md`](docs/handoff/HANDOFF.md)

---

## What is Vishvakarma.OS?

Vishvakarma.OS is a browser-native architectural design tool that combines a **2D blueprint canvas** with a **live 3D model chamber**, wrapped in a governance operating system that enforces spec compliance, change control, audit logging, and release gating.

It is designed as a professional architectural OS — not just a drawing app. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is logged in an audit trail.

---

## Verified working surface

| Component | Status | Notes |
|---|---|---|
| 2D Blueprint Editor | Built / production | Wall, door, window, measure, text, dimension, room, MEP, furniture, landscape, Vastu |
| Live 3D Viewport | Built / production | React Three Fiber, wall extrusion, fixtures, materials, atmosphere modes, WebGL fallback |
| iPad/PWA shell | Built | Safe-area/keyboard hardening, touch-target CSS, service worker, upload UX |
| Terrain / landscape | Built | Terrain patches with 2D draw tool and 3D extrusion |
| Projects | Built | Cloud + local project state via current Supabase production path |
| Auth | Built / production path | Supabase email link and Google OAuth cutover work |
| Stripe billing | Built | Checkout, portal, webhooks, tier-based entitlements |
| Governance OS | Built | Spec Center, Registry, Change Requests, Releases, Audit, World Records |
| AI Designer | Built | Gemini-backed requirement extraction and local generation pipeline |
| Optimization | Built | Multi-candidate scoring, cost/council/compliance dimensions |
| Compliance | Built | Prototype rule engine with report/export support |
| Collaboration | Preview | Yjs/WebSocket scaffold with project authorization |

---

## Application routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing home |
| `/features` | Features & Guides | Product reference |
| `/pricing` | Pricing | Plans (requires `VITE_PRICING_PAGE_ENABLED=true`) |
| `/auth` | Account Access | Email link + Google/Apple OAuth surface |
| `/reset-password` | Reset Password | Redirects to auth when unconfigured |
| `/404` | Not Found | Unknown route fallback |
| `/editor` | Blueprint Editor | Main 2D + 3D workspace |
| `/projects` | Projects | Cloud/local project list |
| `/optimization` | Design Optimization | Candidate scoring and promotion |
| `/profile` | Profile | Account + billing |
| `/spec-center` | Spec Center | Locked governing specifications |
| `/registry` | Registry Center | Component and feature inventory |
| `/change-requests` | Change Requests | Governed change workflow |
| `/releases` | Release Center | Gate-checked release pipeline |
| `/audit` | Audit Log | Full system event timeline |
| `/world-records` | World Records | Self-verified gate-count registry + measurement artifact |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite / rolldown-vite |
| Styling | Tailwind CSS v3 + CSS custom properties |
| UI Components | Radix UI / shadcn-style primitives |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Backend / DB | Supabase Auth + Postgres + Storage |
| Billing | Stripe |
| AI | Google Gemini via `@google/generative-ai` |
| Realtime scaffold | Yjs + y-websocket |
| Routing | React Router v7 |
| Testing | Vitest + Playwright |
| Quality | Biome + tsgo + ast-grep + custom release gates |

---

## Local development

### Requirements

- **Node.js** 20.x (see `package.json` / `.nvmrc`)
- **pnpm** 9.15.0

### Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

### Core verification

```bash
pnpm run hardening:gates
pnpm run auth:gates
pnpm run verify:supabase-schema
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
pnpm run test
pnpm run build
```

Full CI-style run:

```bash
pnpm run verify:ci
pnpm run release:gates
```

---

## Supabase production backend

Current production architecture is Supabase-first.

Typical env variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=https://vishvakarma-os.app
```

Setup and verification helpers:

```bash
pnpm run setup:supabase-auth
pnpm run setup:supabase-auth:full
pnpm run push:supabase-env-vercel
pnpm run verify:supabase-schema
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:supabase-login-data
```

Migration helpers retained for archive/portability work:

```bash
node scripts/migration/export-supabase.mjs
pnpm run migration:import-supabase -- --in=migration/your-legacy-export.json
```

See [`MIGRATION.md`](MIGRATION.md) for backend cutover and import/export details.

---

## Stripe billing

Stripe integration includes checkout, customer portal, webhooks, tier gates, and verification scripts.

```bash
pnpm run setup:stripe
pnpm run setup:stripe-live
pnpm run setup:stripe-live:cli
pnpm run verify:stripe-billing
```

Primary server-only env variables:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STUDIO_MONTHLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=
```

---

## Project structure

```text
src/
  components/editor/       2D/3D editor UI
  pages/                   routes and governance pages
  backend/supabase/        current production backend gateways
  db/api.ts                persistence facade
  modules/                 export, import, compliance, optimization, permit, governance
  services/                cost, council, copilot, optimization, planning
  governance/              release gates, records, snapshots
api/
  stripe/                  checkout, portal, webhook routes
  ai/                      Gemini-backed parsing/extraction routes
server/collab/             Yjs WebSocket presence server
docs/                      specs, release evidence, current architecture addendum
scripts/                   verify, auth, billing, migration, evidence, repair helpers
public/samples/            sample project manifests
```

---

## Design system

Vishvakarma.OS uses a **gold workstation** visual language:

- Always-dark editor chrome and drafting canvas
- Light governance panels
- Metallic gold primary accents
- Minimum 44×44 px touch targets for iPad
- Semantic CSS tokens only
- Devanagari/Sanskrit-inspired brand layers on marketing/auth surfaces

---

## Documentation

| Document | Description |
|---|---|
| [`docs/CURRENT_PRODUCTION_ARCHITECTURE.md`](docs/CURRENT_PRODUCTION_ARCHITECTURE.md) | Current Supabase production architecture addendum |
| [`docs/SOFTWARE_INVENTORY.md`](docs/SOFTWARE_INVENTORY.md) | Technical inventory and valuation reference |
| [`docs/PRODUCT_CAPABILITIES.md`](docs/PRODUCT_CAPABILITIES.md) | Audited feature brief |
| [`docs/release/DEPLOYMENT.md`](docs/release/DEPLOYMENT.md) | Production deployment guide |
| [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) | Vercel env matrix |
| [`docs/release/STRIPE_SETUP.md`](docs/release/STRIPE_SETUP.md) | Billing rollout guide |
| [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) | Governance workflow |
| [`docs/world-record/WORLD_RECORD_CLAIM.md`](docs/world-record/WORLD_RECORD_CLAIM.md) | Self-verified gate-count evidence |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |
| [`supabase/README.md`](supabase/README.md) | Supabase schema and auth setup |
| [`SECURITY.md`](SECURITY.md) | Security policy |

---

## Production deployment

```bash
pnpm install --frozen-lockfile
pnpm run hardening:gates
pnpm run auth:gates
pnpm run verify:supabase-schema
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
pnpm run release:gates
vercel deploy --prod --yes
```

After deploying auth/backend changes, manually verify:

1. `/auth` loads and shows Supabase auth status.
2. Google OAuth completes and redirects to `/editor`.
3. `/projects` loads project state.
4. `/editor` opens 2D + 3D surfaces.
5. Terrain and landscape tools work.
6. Stripe checkout and portal routes resolve with valid auth.
7. iPad Safari can sign in and use the PWA shell.

---

## Governance model

Vishvakarma.OS enforces a no-drift governance model:

- All major system changes are represented through specs, gates, or release evidence.
- Release gates must pass or be explicitly waived with evidence.
- Gate 13 requires a machine-readable world-record measurement artifact.
- System actions are written to the audit trail.

```bash
pnpm run record:measure
pnpm run release:gates
pnpm run launch:evidence:strict
```

---

## Browser support

| Browser | Minimum Version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| iOS Safari | 14+ |

WebGL 2 is preferred for full 3D rendering. WebGL 1 is accepted as a fallback. If neither is available the app degrades gracefully to 2D-only mode.
