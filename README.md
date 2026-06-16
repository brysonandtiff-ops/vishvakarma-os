<div align="center">

# Vishvakarma.OS

### The governed architectural operating system for the browser

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — engineered around a strict governance core that enforces spec compliance, change control, audit logging, and release gating on every action.**

[![Production](https://img.shields.io/badge/production-v1.5.0%20live-brightgreen)](https://vishvakarma-os.app)
[![Release gates](https://img.shields.io/badge/release%20gates-13%2F13%20strict-blueviolet)](#governance-model)
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Supabase-informational)](#technology)
[![Platform](https://img.shields.io/badge/platform-iPad%20·%20PWA%20·%20WebGL%202-0a7ea4)](#browser-support)
[![Node](https://img.shields.io/badge/node-20.x-339933)](.nvmrc)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#contributing--security)

[**Live app**](https://vishvakarma-os.app) · [**Documentation**](docs/README.md) · [**Architecture**](docs/CURRENT_PRODUCTION_ARCHITECTURE.md) · [**Due diligence**](docs/handoff/HANDOFF.md) · [**Changelog**](CHANGELOG.md)

</div>

---

## Table of contents

- [Why Vishvakarma.OS](#why-vishvakarmaos)
- [Production status](#production-status)
- [Verified working surface](#verified-working-surface)
- [Application routes](#application-routes)
- [Technology](#technology)
- [Quick start](#quick-start)
- [Supabase production backend](#supabase-production-backend)
- [Stripe billing](#stripe-billing)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Governance model](#governance-model)
- [Production deployment](#production-deployment)
- [Browser support](#browser-support)
- [Documentation](#documentation)
- [Contributing & security](#contributing--security)

---

## Why Vishvakarma.OS

Most design tools let anything change at any time. Vishvakarma.OS is built on the opposite premise: **nothing ships unless it is specified, gated, and provable.**

It pairs a precision **2D blueprint canvas** with a **live 3D model chamber**, then wraps both in a governance operating system that treats architectural intent as a regulated artifact. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is written to an immutable audit trail.

The result is not "a drawing app." It is a professional architectural OS where correctness, traceability, and release discipline are first-class features — engineered to run anywhere a browser does, with the iPad as a first-class workstation.

| | |
|---|---|
| ✏️ **Draft with precision** | Walls, doors, windows, dimensions, rooms, MEP, furniture, landscape, and Vastu layers on a touch-tuned 2D canvas. |
| 🧊 **See it live in 3D** | React Three Fiber model chamber with wall extrusion, fixtures, materials, atmosphere modes, and graceful WebGL fallback. |
| 🛡️ **Govern every change** | Spec Center, Registry, Change Requests, Releases, Audit, and World Records — a no-drift control plane. |
| 📱 **Ship to any surface** | iPad-first PWA shell with safe-area hardening, 44 px touch targets, offline service worker, and desktop parity. |
| 🤖 **Design with AI** | Gemini-backed requirement extraction and a multi-candidate optimization pipeline scored on cost, council, and compliance. |
| 🚦 **Release with proof** | 13/13 strict release gates, machine-readable evidence, and a self-verified world-record measurement artifact. |

---

## Production status

| | |
|---|---|
| **Version** | `v1.5.0` — released 2026-06-14 ([changelog](CHANGELOG.md)) |
| **Canonical URL** | [vishvakarma-os.app](https://vishvakarma-os.app) |
| **Fallback URL** | [vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app) |
| **Backend** | Supabase-first / Supabase-only production path: auth, Postgres persistence, storage, billing entitlement state, and collaboration metadata |
| **Release posture** | 13/13 strict gates, Gate 13 backed by a machine-readable world-record measurement artifact |

> **AI / ChatGPT context (paste-ready):** [`docs/handoff/CHATGPT_HANDOFF.md`](docs/handoff/CHATGPT_HANDOFF.md)
> **Valuation / due-diligence pack:** [`docs/handoff/HANDOFF.md`](docs/handoff/HANDOFF.md)
> **Current-state architecture addendum:** [`docs/CURRENT_PRODUCTION_ARCHITECTURE.md`](docs/CURRENT_PRODUCTION_ARCHITECTURE.md)

Earlier v1.2.x work implemented Firebase/Supabase dual-backend migration paths. Those Firebase files and migration utilities remain useful for archive recovery and portability evidence, but current production docs treat **Supabase as the active runtime backend** unless a later commit explicitly restores Firebase runtime selection.

---

## Verified working surface

Every row below reflects audited, shipped behavior — not roadmap aspiration.

| Component | Status | Notes |
|---|---|---|
| 2D Blueprint Editor | ✅ Production | Wall, door, window, measure, text, dimension, room, MEP, furniture, landscape, Vastu |
| Live 3D Viewport | ✅ Production | React Three Fiber, wall extrusion, fixtures, materials, atmosphere modes, WebGL fallback |
| iPad / PWA shell | ✅ Built | Safe-area & keyboard hardening, touch-target CSS, service worker, upload UX |
| Terrain / landscape | ✅ Built | Terrain patches with 2D draw tool and 3D extrusion |
| Projects | ✅ Built | Cloud + local project state via the current Supabase production path |
| Auth | ✅ Production path | Supabase email link and Google OAuth cutover |
| Stripe billing | ✅ Built | Checkout, portal, webhooks, tier-based entitlements |
| Governance OS | ✅ Built | Spec Center, Registry, Change Requests, Releases, Audit, World Records |
| AI Designer | ✅ Built | Gemini-backed requirement extraction and local generation pipeline |
| Optimization | ✅ Built | Multi-candidate scoring across cost / council / compliance dimensions |
| Compliance | ✅ Built | Prototype rule engine with report / export support |
| Collaboration | 🔬 Preview | Yjs / WebSocket scaffold with project authorization |

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

## Technology

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite / rolldown-vite |
| Styling | Tailwind CSS v3 + CSS custom properties |
| UI components | Radix UI / shadcn-style primitives |
| 3D engine | Three.js + React Three Fiber + Drei |
| Backend / DB | Supabase Auth + Postgres + Storage |
| Billing | Stripe |
| AI | Google Gemini via `@google/generative-ai` |
| Realtime scaffold | Yjs + y-websocket |
| Routing | React Router v7 |
| Testing | Vitest + Playwright |
| Quality | Biome + tsgo + ast-grep + custom release gates |

---

## Quick start

### Requirements

- **Node.js** 20.x (see [`.nvmrc`](.nvmrc) / `package.json`)
- **pnpm** 9.15.0

### Install & run

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

The dev server boots at `http://127.0.0.1:5173`.

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

### Full CI-style run

```bash
pnpm run verify:ci
pnpm run release:gates
```

---

## Supabase production backend

Current production architecture is **Supabase-first**.

Typical environment variables:

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

Migration helpers retained for archive / portability work:

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

Primary server-only environment variables:

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
- Minimum 44 × 44 px touch targets for iPad
- Semantic CSS tokens only
- Devanagari / Sanskrit-inspired brand layers on marketing and auth surfaces

---

## Governance model

Vishvakarma.OS enforces a **no-drift** governance model — the discipline that separates this from a drawing tool:

- All major system changes are represented through specs, gates, or release evidence.
- Release gates must pass or be explicitly waived with evidence.
- **Gate 13** requires a machine-readable world-record measurement artifact.
- Every system action is written to the audit trail.

```bash
pnpm run record:measure
pnpm run release:gates
pnpm run launch:evidence:strict
```

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

## Browser support

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| iOS Safari | 14+ |

WebGL 2 is preferred for full 3D rendering. WebGL 1 is accepted as a fallback. If neither is available the app degrades gracefully to a 2D-only mode.

---

## Documentation

| Portal | Entry |
|---|---|
| **[docs/README.md](docs/README.md)** | Documentation hub — developer, operator, user, due diligence |
| [developer/ONBOARDING.md](docs/developer/ONBOARDING.md) | New developer day-1 guide |
| [operations/README.md](docs/operations/README.md) | Operator runbooks |
| [user/README.md](docs/user/README.md) | End-user help |
| [handoff/HANDOFF.md](docs/handoff/HANDOFF.md) | Valuation / due-diligence pack |

| Document | Description |
|---|---|
| [`docs/CURRENT_PRODUCTION_ARCHITECTURE.md`](docs/CURRENT_PRODUCTION_ARCHITECTURE.md) | Current Supabase production architecture addendum |
| [`docs/SOFTWARE_INVENTORY.md`](docs/SOFTWARE_INVENTORY.md) | Technical inventory and valuation reference |
| [`docs/PRODUCT_CAPABILITIES.md`](docs/PRODUCT_CAPABILITIES.md) | Audited feature brief |
| [`docs/release/DEPLOYMENT.md`](docs/release/DEPLOYMENT.md) | Production deployment guide |
| [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) | Vercel env matrix |
| [`docs/release/STRIPE_SETUP.md`](docs/release/STRIPE_SETUP.md) | Billing rollout guide |
| [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) | Governance workflow |
| [`docs/archive/README.md`](docs/archive/README.md) | Historical build snapshots |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |
| [`supabase/README.md`](supabase/README.md) | Supabase schema and auth setup |
| [`SECURITY.md`](SECURITY.md) | Security policy |

---

## Contributing & security

- **Contributing:** see [`CONTRIBUTING.md`](CONTRIBUTING.md) — all changes flow through the governed change-request and release-gate pipeline.
- **Code of conduct:** see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- **Security:** report vulnerabilities per [`SECURITY.md`](SECURITY.md). Please do not open public issues for security reports.

---

<div align="center">

**Vishvakarma.OS** — drafted with precision, governed by design.

© 2026 Vishvakarma.OS · Proprietary — all rights reserved · [vishvakarma-os.app](https://vishvakarma-os.app)

</div>
