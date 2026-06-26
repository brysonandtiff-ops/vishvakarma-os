# Vishvakarma.OS — End-to-End System Handoff

**Document type:** Complete technical handoff — product, architecture, runtime, data, operations
**Product version:** v1.5.0
**Last updated:** 2026-06-16
**Canonical production URL:** https://vishvakarma-os.app
**Vercel fallback URL:** https://vishvakarma-os.vercel.app
**Git remote:** https://github.com/brysonandtiff-ops/vishvakarma-os.git
**Repository root:** `vishvakarma-os-live/` (the parent workspace folder is a thin wrapper)

> **Scope.** This is a single, self-contained description of the entire software: what it is, every major subsystem, how data flows, how it is built/tested/deployed, and what an operator needs to run or transfer it. For drill-downs, the modular annexes ([01](./01-product-and-business.md)–[10](./10-ip-risks-roadmap-and-gaps.md)) and auto-generated [appendices](./appendices/) remain the deeper reference. When documents conflict, this doc and [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md) win.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Product overview](#2-product-overview)
3. [Business model, pricing & roles](#3-business-model-pricing--roles)
4. [System architecture at a glance](#4-system-architecture-at-a-glance)
5. [Frontend application (SPA)](#5-frontend-application-spa)
6. [Application surface (routes)](#6-application-surface-routes)
7. [The editor: 2D canvas + live 3D](#7-the-editor-2d-canvas--live-3d)
8. [Core engines: model, exporters, importers, simulations](#8-core-engines-model-exporters-importers-simulations)
9. [Intelligence subsystems: AI, planning, optimization, cost, council, compliance](#9-intelligence-subsystems)
10. [Akasha Cast (semantic broadcast)](#10-akasha-cast-semantic-broadcast)
11. [Collaboration (preview)](#11-collaboration-preview)
12. [Governance OS](#12-governance-os)
13. [Backend: Supabase](#13-backend-supabase)
14. [Serverless API (Vercel functions)](#14-serverless-api-vercel-functions)
15. [Collaboration presence server](#15-collaboration-presence-server)
16. [Billing: Stripe](#16-billing-stripe)
17. [Data model & persistence](#17-data-model--persistence)
18. [Security & hardening](#18-security--hardening)
19. [Build, tooling & quality gates](#19-build-tooling--quality-gates)
20. [Testing strategy](#20-testing-strategy)
21. [Automation: pipelines, repairbot, auto-ship](#21-automation-pipelines-repairbot-auto-ship)
22. [Deployment & operations](#22-deployment--operations)
23. [Environment variables](#23-environment-variables)
24. [Repository map](#24-repository-map)
25. [Technology reference](#25-technology-reference)
26. [Known gaps, disclaimers & roadmap](#26-known-gaps-disclaimers--roadmap)
27. [Operator handoff checklist](#27-operator-handoff-checklist)
28. [Glossary](#28-glossary)

---

## 1. Executive summary

**Vishvakarma.OS is an iPad-first, browser-native architectural workstation with a strict governance core.** It is a single-page application (Vite + React 18 + TypeScript) that pairs a precision **2D blueprint canvas** with a **live 3D model chamber** (Three.js / React Three Fiber), then wraps both in a **governance operating system** that enforces spec compliance, change control, audit logging, and release gating.

It integrates seven capability pillars:

1. **CAD-lite 2D drafting** — walls, openings, MEP, furniture, landscape, terrain, Vastu.
2. **BIM-lite live 2D→3D sync** — wall extrusion, fixtures, materials, solar lighting, GLB models.
3. **AI architecture copilot** — Gemini-backed requirement extraction + local generation/planning.
4. **Multi-objective design optimization** — candidate scoring across cost, council, and compliance.
5. **Rule-based compliance pre-check** — decision-support (NBC/NCC/zoning/fire/energy/accessibility), *not certified*.
6. **Governance OS** — specs, registry, change requests, gated releases, audit trail, world records.
7. **Akasha Cast** — semantic "lens" broadcasting of a live design session to invited viewers.

**Runtime backend is Supabase-only** (Auth, Postgres + Row-Level Security, Storage, billing entitlement state). **Stripe** handles payments. **Vercel** hosts the SPA and serverless API routes. A standalone Node **Yjs WebSocket presence server** backs the collaboration preview. Firebase artifacts exist only as **legacy migration tooling**, not the runtime path.

**Important framing facts:**

- This is **not Next.js**. Routing is client-side via **React Router 7**; API routes are **Vercel serverless functions** in `api/`.
- Monetization tiers: **Starter (free)**, **Studio ($499/mo, 14-day trial)**, **Enterprise ($1,000/mo)**.
- Release discipline is enforced by **19 numbered gates** (gates 1–12 are the primary "world-record" metric; gate 13 is a machine-readable measurement artifact; gates 14–18 are advanced "world-class" gates; gate 19 is a multi-device audit).

| Fact | Value |
|------|-------|
| Product version | 1.5.0 |
| Supabase project ref | `jyocvwipthswfcmvqgqe` |
| Node | 20.x |
| Package manager | pnpm 9.15.0 |
| Runtime backend | Supabase Auth + Postgres (RLS) + Storage |
| Payments | Stripe Checkout + Portal + webhooks |
| AI | Google Gemini via `api/ai/*` (`GEMINI_API_KEY`) |
| Hosting | Vercel (SPA + serverless `api/`) |

---

## 2. Product overview

Vishvakarma.OS treats architectural intent as a **regulated artifact**: nothing meaningful changes without a spec, a gate, or release evidence. The core user journey:

1. **Sign in** (`/auth`) via Supabase email magic-link or Google OAuth.
2. **Create or open a project** (`/projects`) — cloud-backed (Supabase) or local draft.
3. **Draft in the editor** (`/editor`) on the 2D canvas; the 3D viewport updates live.
4. **Run intelligence** — AI copilot to generate/refine, optimization to compare candidates, compliance to pre-check, cost/council to estimate.
5. **Govern** — promote work through specs, registry, change requests, and gated releases; everything lands in the audit log.
6. **Export / present** — PNG/PDF/DXF/SVG exports, permit packages, sheet sets, or live **Akasha Cast** broadcast.

The product is positioned as a **professional architectural OS**, with the iPad as a first-class workstation (touch-tuned UI, PWA install, offline service worker).

---

## 3. Business model, pricing & roles

### Pricing tiers (`src/config/billingPlans.ts`)

| Tier | Price | Trial | Highlights |
|------|-------|-------|-----------|
| **Starter** | Free | — | Core 2D/3D, PNG export, local-first |
| **Studio** | **$499/mo** (`49900` cents) | **14 days** | Unlimited projects, full Sacred 3D, export package (PNG/PDF/DXF/SVG), cloud save, Project Proof governance, Vastu + Panchatattva scoring, India NBC pre-check + INR cost regions, **Akasha Cast** |
| **Enterprise** | **$1,000/mo** (`100000` cents) | — | Everything in Studio + SSO/SAML, API access, dedicated onboarding, custom templates, Indian residential sample library, Akasha Cast role invites + evidence export, collaboration (planned) |

Self-serve checkout is enabled for Studio and Enterprise. Entitlement state is stored in the Supabase `billing` table and synced from Stripe webhooks.

### Project roles (`src/domain/projects/projectRoles.ts`)

Per-project membership with an invite hierarchy:

| Role | Purpose |
|------|---------|
| `owner` | Full control; can invite every role |
| `co_owner` | Near-owner; can invite all collaborator roles |
| `architect` | Design authorship |
| `builder` | Construction-side collaborator |
| `engineer` | Technical reviewer (compliance, buildability, construction docs) |
| `family` | Non-technical stakeholder |
| `council_reviewer` | External reviewer for council submission context |
| `viewer` | Read/comment only |

Roles are enforced both in the UI and through Supabase RLS on the `projects.collaborators` array.

---

## 4. System architecture at a glance

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (browser / iPad)                    │
│  Vite + React 18 SPA  ·  React Router 7  ·  Tailwind + Radix       │
│                                                                    │
│  Editor (2D canvas + R3F 3D)  Governance pages  AI / Optimization  │
│        │                │                │              │          │
│        ▼                ▼                ▼              ▼          │
│  src/db/api.ts  ·  backend/supabase gateways  ·  src/cast / collab │
└──────────────┬───────────────────────┬───────────────┬────────────┘
               │                        │               │
        Supabase JS SDK         Vercel serverless     Yjs WebSocket
               │                  functions (api/)    presence server
               ▼                        ▼               ▼
   ┌────────────────────┐   ┌─────────────────────┐  ┌──────────────┐
   │   Supabase         │   │ api/stripe/*        │  │ server/      │
   │  Auth · Postgres   │   │ api/ai/*  (Gemini)  │  │  collab/     │
   │  (RLS) · Storage   │   │ api/cast/* · health │  │ presence     │
   └────────┬───────────┘   └──────────┬──────────┘  └──────────────┘
            │                          │
            ▼                          ▼
       Postgres tables           Stripe API · Gemini API
```

**Data ownership boundaries:**

- **Client never holds service-role secrets.** Anything privileged (Stripe secret, Supabase service role, Gemini key) lives only in serverless functions or scripts.
- **`src/db/api.ts`** is the single persistence facade the UI calls; it routes to the Supabase gateways under `src/backend/supabase/`.
- **All cross-cutting reads/writes flow through governed paths** so the audit log and gates stay coherent.

---

## 5. Frontend application (SPA)

- **Entry:** `index.html` → `src/main.tsx` → `src/App.tsx` → `src/AppRoutes.tsx` / `src/routes.tsx`.
- **Framework:** React 18 + TypeScript, built by **Vite / rolldown-vite**.
- **Routing:** React Router 7, routes declared in `src/routes.tsx` with `public` / `private` access flags and lazy-loaded pages (the editor is eagerly loaded for fast first paint).
- **State & contexts:** React context providers in `src/contexts/` (auth/session, theme, studio audio, editor sidebar, etc.).
- **Styling:** Tailwind CSS v3 + CSS custom properties; Radix UI / shadcn-style primitives in `src/components/ui/`. Visual language is the **"gold workstation"** theme (`src/theme/`, `src/vish-theme.css`, `src/ipad-workspace.css`).
- **PWA:** `vite-plugin-pwa` service worker, installable shell, generated icon set (`pnpm run assets:pwa-icons`), iPad safe-area/keyboard hardening.
- **Monitoring:** Sentry (`@sentry/react`) and Vercel Analytics.

---

## 6. Application surface (routes)

Declared in `src/routes.tsx`. Public routes are reachable signed-out; private routes require a Supabase session.

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Landing | public | Marketing home |
| `/features` | Features & Guides | public | Product reference |
| `/pricing` | Pricing | public | Plans (gated by `VITE_PRICING_PAGE_ENABLED=true`) |
| `/auth` | Account Access | public | Email magic-link + Google/Apple OAuth |
| `/reset-password` | Reset Password | public | Redirects to auth when unconfigured |
| `/cast/:token` | Akasha Cast Viewer | public | Token-scoped live broadcast viewer |
| `/404` | Not Found | public | Unknown-route fallback |
| `/editor` | Blueprint Editor | private | Main 2D + 3D workspace |
| `/projects` | Projects | private | Cloud/local project list |
| `/optimization` | Design Optimization | private | Candidate scoring and promotion |
| `/profile` | Profile | private | Account + billing |
| `/spec-center` | Spec Center | private | Locked governing specifications |
| `/registry` | Registry Center | private | Component/feature inventory |
| `/change-requests` | Change Requests | private | Governed change workflow |
| `/releases` | Release Center | private | Gate-checked release pipeline |
| `/world-records` | World Records | private | Gate-count registry + measurement artifact |
| `/audit` | Audit Log | private | Full system event timeline |

Route registration is also mirrored to the `route_manifest` Postgres table and validated by gate 3.

---

## 7. The editor: 2D canvas + live 3D

The editor (`src/pages/EditorPage.tsx`, `src/components/editor/`, ~48 components) is the product's center of gravity.

### 2D blueprint canvas

- **Renderer:** `BlueprintCanvas.tsx` + `blueprintCanvasDrawing.ts`, with modular draw passes (`blueprint/drawRooms`, `drawWalls`, `inputHandlers`) and a spatial index (`src/editor/spatialIndex.ts`) for hit-testing.
- **Tools** (`src/editor/toolMeta.ts`): Select, Pan, Wall, Door, Window, Measure, Label, Dimension, Room, Column, Stair, Vastu, MEP, Furniture, Landscape, Terrain.
- **Interaction:** radial tool menu (`RadialToolMenu.tsx`), keyboard shortcuts, orthogonal wall-draw lock (Shift), wall endpoint drag with live metric/imperial length, room-type fill palette, layer panel, minimap.
- **Drafts:** autosave via `draftSave.worker.ts` + `src/editor/localDraft.ts` with a recovery dialog; local projects in `localProjects.ts`.

### Live 3D viewport

- **Renderer:** `Viewport3D.tsx` (React Three Fiber + Drei), batched meshes for walls/rooms/terrain (`sceneWallBatch`, `sceneRoomBatch`, `sceneTerrainMeshes`), GLB models (`sceneGltfModels`), PBR materials (`sceneMaterials`).
- **Live sync:** 2D edits extrude into 3D in real time; multi-floor stacking with ghost lower floors.
- **Atmosphere:** solar timeline (`SolarTimeline.tsx`), lighting presets, cinematic bloom via `postprocessing` EffectComposer (desktop-gated, wall-count capped), post-processing pipeline (`ScenePostProcessing.tsx`).
- **Performance:** adaptive frame governor (`AdaptiveFrameGovernor.tsx`), perf HUD (`EditorPerfHud.tsx`), bundle/perf budgets enforced in CI.
- **Resilience:** WebGL 2 preferred, WebGL 1 fallback, graceful 2D-only degradation when neither is available.

### Editor support surfaces

Properties panel, layer panel, floor switcher, furniture/material pickers, custom material dialog, import/export floor-plan dialogs, sample picker, onboarding panel + welcome overlay, voice mic, collaboration bar, compass/cost readout, save-state badges, and the Project Proof governance panel.

---

## 8. Core engines: model, exporters, importers, simulations

`src/core/` holds the deterministic engines beneath the UI.

- **Project model & manifest:** `projectModel.ts`, `manifestSchema.ts`, `specValidation.ts`, `projectExport.ts` — the canonical project shape and serialization. Manifest schema also documented in `docs/project-manifest-schema.md`.
- **Floor-plan engine:** `floorPlanEngine.ts` — geometry derivation from the manifest.
- **Exporters (`src/core/exporters/`):** PNG (`pngExport`), PDF (`pdfExport`), DXF (`dxfExport`), floor-plan SVG (`floorPlanSvg`), site-plan SVG (`sitePlanSvg`).
- **Importers (`src/core/importers/`):** DXF import (`dxfImport`) supporting `LINE` and `LWPOLYLINE` entities with layer filtering (gate 16 regression).
- **Catalogs:** scene model/texture/PBR/terrain/visual catalogs and sample catalog drive the asset libraries.
- **Simulations (`src/core/simulations/`):**
  - `vastu.ts` / `vastuOverlay.ts` — Vastu compliance overlay.
  - `panchatattva.ts` — five-element scoring.
  - `tvashtar.ts` — design/aesthetic scoring.
  - `thermalEngine.ts` — thermal comfort.
  - `vayuCFD.ts` — airflow/ventilation approximation.

`src/core-contract/` defines machine-checkable schemas (build-gate, compliance, cost, output, pipeline, system) and the `systemFlow` contract that ties pipeline stages together — the backbone the governance gates assert against.

---

## 9. Intelligence subsystems

### AI copilot (`src/ai/`, `src/modules/ai-designer/`, `api/ai/`)

- **Serverless Gemini routes:** `api/ai/extract-requirements.ts` (turns a natural-language brief into structured requirements) and `api/ai/parse-site-documents.ts` (extracts site constraints from uploaded docs). Both require `GEMINI_API_KEY` and run server-side only.
- **Local generation:** `buildingDesignerModule.ts` and the floor-plan generation orchestrator (`src/services/floorplan-generation/`) build layouts from requirements.
- **Copilot domain:** `src/domain/copilot/` — concept design, council requirements, material lists, session state.

### Planning & optimization (`src/planning/`, `src/services/optimization/`, `src/modules/optimization/`)

- **Candidate generation** runs in a Web Worker (`planning.worker.ts` + `planningWorkerClient.ts`) to keep the UI responsive.
- **Scoring** combines weighted dimensions (`planScoringEngine.ts`, `scoringWeights.ts`, `siteFitness`, `moatGainAnalyzer`, `budgetOptimizer`).
- **Optimization batches** persist to the `optimization_batches` Postgres table; results surface on `/optimization`.

### Cost intelligence (`src/services/cost-estimation/`)

Labor cost engine, material database, regional cost index (incl. INR regions), supplier pricing, risk/confidence/moat analyzers, orchestrated by `costIntelligenceOrchestrator.ts`.

### Council intelligence (`src/services/council-intelligence/`, `src/modules/council-intelligence/`)

Models council/permitting requirements and conditions to inform submissions.

### Compliance & rules (`src/modules/compliance/`, `src/services/compliance/`, `src/rules/`)

- **Rule packs** in `src/rules/` cover: **NBC** (India), **NCC** (Australia), **zoning** (setback, coverage, council conditions), **fire** (egress, smoke alarms), **energy** (glazing ratio, thermal comfort), **accessibility** (door width, circulation width). Registered via `src/rules/registry.ts`.
- **Compliance module** aggregates rule results into reports with export support (`complianceReportExport.ts`) and a compliance gate (`complianceGate.ts`).
- **Disclaimer enforcement:** gate 18 verifies every compliance/council/cost export carries a prototype/decision-support disclaimer — this is **pre-check guidance, not certified approval**.

### Permit & sheet sets (`src/modules/permit/`, `src/modules/sheetSet/`)

Permit package export and a sheet-set composer producing title/plan/elevation page descriptors with PDF export (gate 17).

### Architecture bot (`src/services/architecture-bot/`)

In-app issue scanning and repair orchestration that proposes fixes for detected structural/spec issues.

---

## 10. Akasha Cast (semantic broadcast)

**Akasha Cast** lets a presenter broadcast a live design session — not just pixels, but **semantic "lenses"** (thermal, Vayu airflow, Vastu, MEP, compliance, Panchatattva, layer visibility) plus a chrono/lighting lock and optional intent relay.

- **Client:** `src/cast/` — `CastSessionManager`, `CastLensState`, `CastIntentRelay`, `LocalCastBus`, `useCastSession`, `CastEvidenceExporter`, tiering (`castTier.ts`).
- **Viewer route:** `/cast/:token` (`CastViewerPage`) — public, token-scoped.
- **Serverless API:** `api/cast/sessions.ts` (create/manage), `api/cast/join.ts` (token join), `api/cast/evidence.ts` (evidence export).
- **Persistence:** `cast_sessions`, `cast_invites`, `cast_events` Postgres tables (migration `20260615000001_cast_sessions.sql`) with RLS scoping to host/members.
- **Tiering:** Studio gets Akasha Cast broadcasting; Enterprise adds role invites + evidence export.

---

## 11. Collaboration (preview)

A **preview-stage** real-time collaboration layer (not yet GA):

- **Client:** `src/collaboration/` — CRDT manifest bridge/doc (`crdt/manifestDoc.ts`), `CollabSession`, transport adapter, `YjsWebSocketProvider`, `SupabaseSnapshotProvider`, read-only presence.
- **Transport:** **Yjs + y-websocket**.
- **Server:** `server/collab/presenceServer.ts` (run via `pnpm run collab:server`), authorized against project membership (`server/collab/auth.ts`).
- **Persistence:** snapshots into Supabase; `projects.collaborators` (GIN-indexed) gates membership via RLS.

Status: scaffold with project authorization. Treat as preview; not part of the strict production guarantee.

---

## 12. Governance OS

The differentiator: a no-drift control plane (`src/governance/`, governance pages, `src/modules/governanceLock.ts`).

### Governance surfaces

| Page | Table | Purpose |
|------|-------|---------|
| Spec Center (`/spec-center`) | `specs` | Locked governing specifications (admin-managed) |
| Registry (`/registry`) | `registry` | Component/feature inventory |
| Change Requests (`/change-requests`) | `change_requests` | Governed change workflow (author → review → merge) |
| Release Center (`/releases`) | `releases` | Gate-checked release pipeline |
| Audit Log (`/audit`) | `audit_logs` | Immutable system event timeline |
| World Records (`/world-records`) | — | Gate-count registry + measurement artifact |

### Release gates (`src/governance/gates/`, `gate-manifest.json` — 19 gates)

| # | Gate | Type |
|---|------|------|
| 1 | Governing spec present | automated |
| 2 | Registry present | automated |
| 3 | Route manifest present | automated |
| 4 | Sample project validates as JSON | automated |
| 5 | Production security headers configured | automated |
| 6 | Environment template present | automated |
| 7 | Unit tests green | automated-strict |
| 8 | E2E route smoke green | automated-strict |
| 9 | Save/load determinism | evidence |
| 10 | 2D/3D parity | evidence |
| 11 | iPad touch-target audit | evidence |
| 12 | Performance acceptable | evidence |
| 13 | World-record evidence present | automated |
| 14 | Compliance rule-pack integrity | automated-strict |
| 15 | BIM graph adapter parity | automated-strict |
| 16 | DXF import regression | automated-strict |
| 17 | Sheet-set composer scaffold | automated |
| 18 | Decision-intelligence disclaimer present | automated |
| 19 | Multi-device touch audit | evidence |

- **Gates 1–12** are the primary "world-record" pre-release metric (`WORLD_RECORD_METRIC_GATE_COUNT = 12`).
- **Gate 13** requires a machine-readable artifact (`docs/world-record/latest-measurement.json`, produced by `pnpm run record:measure`).
- **Gates 14–18** ("world-class") are verified by `scripts/verify-gates-14-18.mjs` (`pnpm run verify:world-class-gates`).
- **Evidence gates** point at proof docs under `docs/release/evidence/`.

Core governance machinery: `governance/core/enforcer.ts` (gate enforcement), `specHash.ts` (spec integrity hashing), `records/worldRecordRegistry.ts`, `snapshots/snapshotManager.ts`. The Release Center UI can export an evidence pack (`downloadEvidencePack`).

---

## 13. Backend: Supabase

**Project ref:** `jyocvwipthswfcmvqgqe`. Migrations in `supabase/migrations/`.

### Tables (all RLS-enabled)

| Table | Ownership model | Notes |
|-------|-----------------|-------|
| `profiles` | own row | Auto-created via `on_auth_user_created` trigger; holds role/billing plan |
| `projects` | own + collaborators | `collaborators` array (GIN index) drives member access |
| `specs` | read: authenticated · write: admin | Governing specs |
| `registry` | read: authenticated · write: admin | Component inventory |
| `change_requests` | author/admin | Governed changes |
| `releases` | read: authenticated · write: admin | Release records |
| `audit_logs` | insert: authenticated · mutate: admin | Append-only event trail |
| `route_manifest` | read: authenticated · write: admin | Mirrors client routes |
| `billing` | own row | Stripe customer + entitlement state |
| `optimization_batches` | own row | Saved optimization runs |
| `cast_sessions` / `cast_invites` / `cast_events` | host/member scoped | Akasha Cast |

### Storage

- **`materials`** bucket — public read, owner-scoped insert/update/delete (custom material uploads).

### Auth

- Supabase email magic-link + Google OAuth (Apple surface present). Redirect origin controlled by `VITE_AUTH_REDIRECT_ORIGIN`. Provider setup automated by `scripts/setup-supabase-auth-providers.mjs` (`pnpm run setup:supabase-auth`).

Schema drift and integrity are checked by `pnpm run verify:supabase-schema[:live]` and `stability:supabase-drift`.

---

## 14. Serverless API (Vercel functions)

TypeScript handlers in `api/`, deployed as Vercel serverless functions. Shared helpers live in `api/_lib/`.

| Handler | Purpose |
|---------|---------|
| `api/health.ts` | Liveness/health probe |
| `api/stripe/create-checkout-session.ts` | Start a Stripe Checkout for a tier |
| `api/stripe/create-portal-session.ts` | Open the Stripe customer portal |
| `api/stripe/webhook.ts` | Receive Stripe events → update `billing` |
| `api/ai/extract-requirements.ts` | Gemini: brief → structured requirements |
| `api/ai/parse-site-documents.ts` | Gemini: site docs → constraints |
| `api/cast/sessions.ts` | Create/manage Akasha Cast sessions |
| `api/cast/join.ts` | Join a cast by token |
| `api/cast/evidence.ts` | Export cast evidence |

**Shared libs (`api/_lib/`):** `stripeClient`, `stripeInvoice`, `billingBackend`, `billingSupabase`, `castBackend`, `verifyAuthToken`, `verifySupabaseToken` (server-side JWT verification so privileged routes trust the caller).

---

## 15. Collaboration presence server

A standalone Node process (`server/collab/`, its own `package.json`):

- `presenceServer.ts` — Yjs WebSocket server for live presence + CRDT sync.
- `auth.ts` — authorizes connections against project membership.
- Run locally: `pnpm run collab:server` (or `:dev` with watch). Deploy separately from the SPA (it is a long-lived WebSocket service, not a serverless function).

---

## 16. Billing: Stripe

- **Client:** `src/services/billing/stripeCheckout.ts` initiates checkout/portal via the serverless routes.
- **Server:** `api/stripe/*` + `api/_lib/billing*`. The webhook is the source of truth that writes entitlement state into Supabase `billing`.
- **Setup scripts:** `setup:stripe` (test products), `setup:stripe-live`, `setup:stripe-live:cli` (creates live products and pushes env to Vercel), `verify:stripe-billing`, `ops:stripe:push-env`, `ops:stripe:rollout`.
- **Server-only env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`.

---

## 17. Data model & persistence

- **Canonical artifact:** the **Project Manifest** (`src/core/manifestSchema.ts`, schema doc `docs/project-manifest-schema.md`) — a JSON document fully describing a design (grid, walls, openings, rooms, materials, environment, viewport, floors, terrain).
- **Persistence facade:** `src/db/api.ts` is the only persistence entry point the UI uses; it delegates to `src/backend/supabase/` gateways.
- **Local-first:** drafts and local projects (`src/editor/localDraft.ts`, `localProjects.ts`) keep work safe offline; a recovery dialog restores unsaved drafts.
- **Portability:** projects export/import as JSON; the manifest is the interchange format. Sample manifests live in `public/samples/`.
- **Migration tooling:** `scripts/migration/export-supabase.mjs`, `import-supabase.mjs`, `validate-migration.mjs`; see [MIGRATION.md](../../MIGRATION.md). Firebase artifacts remain only as legacy export/import helpers.

---

## 18. Security & hardening

- **Secrets isolation:** no service-role/secret keys in client bundles; privileged work is serverless-only. Server JWT verification in `api/_lib/verify*Token.ts`.
- **Row-Level Security:** every Postgres table enforces RLS; ownership/role policies as in §13.
- **HTTP headers (`vercel.json`, gate 5):** CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- **Production hardening gates:** `pnpm run hardening:gates`, `device-hardening:gates`, `auth:gates` (auth config guard), and the `contract:gates` bundle (system contract, forbidden edges, build gate, PWA install assets, project roles).
- **Policy docs:** [SECURITY.md](../../SECURITY.md), [PROPRIETARY_NOTICE.md](../PROPRIETARY_NOTICE.md), [BRAND_LOCK.md](../BRAND_LOCK.md).
- **Compliance caveat:** rule-engine output is decision-support, **not certified** regulatory approval (enforced disclaimer, gate 18).

---

## 19. Build, tooling & quality gates

- **Build:** `pnpm run build` (Vite), preceded by `prebuild` → `scripts/enforce-build.js` (build gate). E2E builds via `preview:e2e`.
- **Type-checking:** `pnpm run lint:types` runs `tsgo` (TypeScript native preview) over `tsconfig.check.json` (app) and `tsconfig.api-check.json` (serverless).
- **Linting / structure:** Biome (`lint:deps`, undeclared-dependency correctness) and **ast-grep** structural lint (`lint:structure`, config in `sgconfig.yml`).
- **Custom gate scripts (`scripts/quality/`):** system contract, forbidden edges, build gate, production hardening, PWA install assets, device hardening, project roles, auth config guard, flawless-use gates, launch evidence.
- **Release verification:** `pnpm run release:gates` (`scripts/verify-all.js`) and `release:gates:strict`; world-class gates via `verify:world-class-gates`.
- **Performance:** bundle budgets (`perf:gates`), bundle report + baseline (`perf:report`), Lighthouse (`perf:lighthouse[:prod]`).
- **Config files:** `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tailwind.config.js`, `biome.json`, `components.json`, `tsconfig.*`, `Dockerfile`, `vercel.json`.

---

## 20. Testing strategy

- **Unit/integration:** **Vitest** (`pnpm run test`, `test:coverage`) — co-located `*.test.ts(x)` across modules, services, rules, core, governance. Production route test: `test:routes`. Regression anchors: `test:anchors`.
- **End-to-end:** **Playwright** (`e2e/`, `tests/`) with projects for app smoke, auth gate, cross-browser (Chromium/Firefox/WebKit), accessibility audit (`@axe-core/playwright`), and editor performance. Orchestrated by `scripts/run-*-gates.mjs` and `run-local-preview-playwright.mjs`.
- **Performance proofs:** `test:perf-overhaul`, `record:perf-overhaul`.
- **Visual/marketing:** screenshot pack and marketing asset capture (`test:screenshots`, `marketing:assets`, `capture:page-references`).
- **Install deps:** `pnpm run test:e2e:install` (Playwright browsers).

---

## 21. Automation: pipelines, repairbot, auto-ship

- **Unified pipeline runner:** `scripts/run-pipeline.mjs` exposes tiers — `verify`, `verify:ci`, `ci`, plus `pipeline`. These compose the gate scripts above into staged runs.
- **DX doctor:** `pnpm run doctor` / `dx:doctor` (`scripts/dx/doctor.mjs`) checks local environment health; `dx:stack` spins a local stack.
- **Repairbot (`scripts/repairbot/`):** an automated self-healing runner with tiers `fast` / `medium` / `full` / `world`, plus `watch`, `dry`, `status`, and `ci-github` (GitHub CI health). The `world` tier mirrors CI + release gates + world-record evidence. It scans for issues and proposes/applies repairs.
- **Auto-ship (`scripts/auto-ship/`):** `pnpm run auto-ship` syncs/commits after edits (the recent `chore(auto-ship): …` commits come from this); installable git hooks via `auto-ship:install-user`.
- **Stability (`scripts/stability/`):** monitoring checks, health probes (`stability:health[:prod]`), post-deploy smoke, Supabase drift detection.
- **Production evidence (`scripts/production/`):** evidence, manual evidence, functional proof generators; env verification; admin/co-owner setup.
- **Handoff/docs automation:** `handoff:generate` / `handoff:verify` regenerate and validate the appendices; `docs:verify` checks documentation integrity.

---

## 22. Deployment & operations

### Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev          # Vite dev server at http://127.0.0.1:5173
```

### Core verification before shipping

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

### Production deploy

```bash
pnpm install --frozen-lockfile
pnpm run release:gates
vercel deploy --prod --yes     # or: pnpm run deploy:vercel
```

### Post-deploy manual verification

1. `/auth` loads and shows Supabase auth status.
2. Google OAuth completes → redirects to `/editor`.
3. `/projects` loads project state.
4. `/editor` opens 2D + 3D surfaces.
5. Terrain and landscape tools work.
6. Stripe checkout + portal resolve with valid auth.
7. iPad Safari can sign in and use the PWA shell.
8. `stability:post-deploy` smoke passes.

The collaboration presence server (`server/collab/`) deploys as a separate long-lived WebSocket service.

---

## 23. Environment variables

Full matrix in [docs/release/VERCEL_ENV.md](../release/VERCEL_ENV.md) and auto-generated [Appendix B](./appendices/B-environment-variables.md). Key variables:

**Client (`VITE_*`, safe to expose):**

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app
VITE_PRICING_PAGE_ENABLED=true
```

**Server-only (never in client bundle):**

```env
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=https://vishvakarma-os.app
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STUDIO_MONTHLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=
```

Verify configured env with `pnpm run production:verify-env`; push Supabase/Stripe env to Vercel with `push:supabase-env-vercel` / `ops:stripe:push-env`.

---

## 24. Repository map

```text
vishvakarma-os-live/
├─ api/                      Vercel serverless functions
│  ├─ _lib/                  stripe, billing, cast, auth-token helpers
│  ├─ ai/                    Gemini requirement/site extraction
│  ├─ cast/                  Akasha Cast sessions/join/evidence
│  ├─ stripe/               checkout, portal, webhook
│  └─ health.ts
├─ server/collab/            Yjs WebSocket presence server
├─ src/
│  ├─ pages/                 route pages (editor + governance)
│  ├─ components/editor/     2D canvas + 3D viewport UI (~48 files)
│  ├─ components/ui/         Radix/shadcn primitives
│  ├─ editor/               tools, drafts, spatial index, workers
│  ├─ core/                  project model, exporters, importers, simulations
│  ├─ core-contract/         machine-checkable system/pipeline schemas
│  ├─ domain/                building graph, copilot, cost, rooms, roles, parcels
│  ├─ modules/               compliance, optimization, permit, sheetSet, governance, studio-audio
│  ├─ services/              cost, council, compliance, optimization, floorplan-gen, architecture-bot, billing
│  ├─ rules/                 NBC, NCC, zoning, fire, energy, accessibility rule packs
│  ├─ planning/              candidate generation + scoring (Web Worker)
│  ├─ ai/                    AI building designer
│  ├─ cast/                  Akasha Cast client
│  ├─ collaboration/         CRDT + Yjs collaboration client (preview)
│  ├─ governance/            gate enforcer, manifests, records, snapshots
│  ├─ backend/supabase/      production backend gateways
│  ├─ db/api.ts              persistence facade
│  ├─ config/, contexts/, hooks/, theme/, lib/, utils/
│  ├─ routes.tsx             route registry
│  └─ main.tsx / App.tsx     SPA entry
├─ supabase/migrations/      Postgres schema (RLS, triggers, storage, cast)
├─ scripts/                  quality gates, verify, setup, ops, repairbot, auto-ship, handoff
├─ docs/                     specs, release, handoff, architecture, ADR/RFC
├─ e2e/ · tests/             Playwright specs
├─ public/                   static assets, PWA icons, sample manifests
└─ config files             vite/vitest/playwright/tailwind/biome/tsconfig/vercel/Dockerfile
```

---

## 25. Technology reference

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite / rolldown-vite |
| Routing | React Router 7 |
| Styling | Tailwind CSS v3 + CSS custom properties |
| UI components | Radix UI / shadcn-style primitives, lucide-react icons |
| 3D engine | Three.js + React Three Fiber + Drei + postprocessing |
| Backend / DB | Supabase Auth + Postgres (RLS) + Storage |
| Billing | Stripe (Checkout, Portal, webhooks) |
| AI | Google Gemini (`@google/generative-ai`) |
| Realtime | Yjs + y-websocket (preview) |
| Forms / validation | react-hook-form + zod |
| Charts | recharts |
| Monitoring | Sentry, Vercel Analytics |
| Testing | Vitest + Playwright + axe-core |
| Quality | Biome + tsgo + ast-grep + custom gate scripts |
| Hosting | Vercel (SPA + serverless), separate Node collab server |

---

## 26. Known gaps, disclaimers & roadmap

- **Compliance is decision-support, not certified.** NBC/NCC/zoning/fire/energy/accessibility rules are pre-checks; gate 18 enforces disclaimers on exports.
- **Collaboration is preview-stage.** The Yjs presence layer and `server/collab/` are scaffolds with authorization, not a GA real-time multiplayer guarantee.
- **Firebase is legacy.** Firebase files/scripts are migration tooling only; Supabase is the sole runtime backend.
- **Enterprise items in flight:** SSO/SAML, API access, and full collaboration are sold/planned but partially implemented — confirm status before quoting to a customer.
- **Roadmap & risks:** see [docs/roadmap/](../roadmap/), [Annex 10](./10-ip-risks-roadmap-and-gaps.md), `docs/rfc/`, `docs/adr/`, and `TODO.md`.

---

## 27. Operator handoff checklist

1. **Accounts to transfer (secrets off-repo):** Vercel project, Supabase project (`jyocvwipthswfcmvqgqe`), Stripe account, Google Cloud (Gemini key + OAuth client), domain registrar for `vishvakarma-os.app`, GitHub repo. Use [`templates/OPERATOR_ANNEX.template.md`](./templates/OPERATOR_ANNEX.template.md) (gitignored) for filled credentials — deliver via secure channel.
2. **Confirm env parity:** `pnpm run production:verify-env`; ensure Vercel Production env matches §23 and Supabase `site_url` = `https://vishvakarma-os.app`.
3. **Run the green path:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm run verify:ci
   pnpm run release:gates
   pnpm run handoff:generate && pnpm run handoff:verify
   ```
4. **Regenerate evidence:** `pnpm run record:measure` (gate 13), `pnpm run production:evidence`.
5. **Verify integrations live:** auth flow (`verify:production-auth-flow`), billing (`verify:stripe-billing`), schema (`verify:supabase-schema:live`).
6. **Read deeper:** [HANDOFF.md](./HANDOFF.md) index → Annexes 01–10 → Appendices A–H → [SOFTWARE_INVENTORY.md](../SOFTWARE_INVENTORY.md).

---

## 28. Glossary

| Term | Meaning |
|------|---------|
| **Project Manifest** | Canonical JSON describing an entire design; the interchange/portability format |
| **Governance OS** | The spec/registry/change-request/release/audit control plane enforcing no-drift |
| **Release gate** | One of 19 numbered checks that block a release until satisfied |
| **World-record metric** | Gates 1–12, the primary pre-release compliance score; gate 13 is the machine-readable artifact |
| **Akasha Cast** | Live broadcast of a design session with semantic lenses (thermal/Vayu/Vastu/MEP/compliance/Panchatattva) |
| **Vastu / Panchatattva / Tvashtar / Vayu** | Sanskrit-rooted design simulations (orientation, five-element, aesthetic, airflow) |
| **Project Proof** | In-editor governance panel attaching evidence to a project |
| **Repairbot** | Automated self-healing runner that scans for and repairs issues |
| **Auto-ship** | Git-hook automation that commits/syncs after edits |
| **Evidence pack** | Exportable JSON bundle of gate statuses + world-record measurement |

---

*Prepared as the single end-to-end reference for Vishvakarma.OS v1.5.0. Regenerate the appendices (`pnpm run handoff:generate`) after material code changes so inventories stay aligned with live code.*
