# Vishvakarma.OS — Software Inventory

**Document type:** Technical inventory and valuation scope reference  
**Product version:** v1.2.x  
**Codebase audit date:** 2026-06-13  
**Production URL:** [vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app)  
**Current production backend:** Supabase-only runtime path for Auth, Postgres/RLS, Storage, billing entitlements, and collaboration metadata

This document is the authoritative current-state record of what has been built in Vishvakarma.OS. It is intended for investors, acquirers, technical due diligence, valuation discussions, and internal roadmap planning.

For the backend cutover addendum, see [`CURRENT_PRODUCTION_ARCHITECTURE.md`](./CURRENT_PRODUCTION_ARCHITECTURE.md).

---

## 1. Executive Summary

Vishvakarma.OS is an iPad-first, browser-native architectural workstation delivered as a single-page application. It combines a 2D blueprint editor, live 3D visualization, iPad/PWA hardening, AI-assisted design generation, multi-objective optimization, compliance pre-checking, cost intelligence, council readiness scoring, permit package export, monetization, and an embedded Governance Operating System.

The current production architecture has been consolidated around Supabase for auth, Postgres/RLS persistence, Storage, billing entitlement state, and collaboration metadata. Earlier Firebase/Firebase-admin and Firestore work remains valuable as migration history, portability evidence, and archive-recovery tooling, but it is not the current production runtime backend.

### Product-class capabilities integrated in one app

1. CAD-lite 2D drafting with walls, openings, labels, dimensions, furniture, MEP, landscape, terrain, and Vastu tools.
2. BIM-lite live 2D→3D sync with materials, solar lighting, MEP fixtures, terrain extrusion, and GLB model support.
3. AI architecture copilot with document ingestion and permit package export.
4. Multi-objective design optimization with cost and council scoring.
5. Rule-based compliance pre-check engine.
6. Enterprise-style governance OS: specs, registry, change requests, releases, audit, world-record evidence.
7. Stripe monetization and tier-gated product surfaces.
8. Supabase production backend with local fallback.

---

## 2. Scope at a Glance

| Metric | Current value / note |
|--------|----------------------|
| Product version | v1.2.x |
| Production hosting | Vercel SPA + serverless API routes |
| Current backend | Supabase-only production path |
| Local fallback | `localStorage` drafts/projects when backend is unconfigured |
| Application routes | Public marketing/auth + authenticated editor/governance/billing routes |
| 2D editor | Production |
| 3D viewport | Production with WebGL fallback |
| iPad hardening | Shipped in v1.2.x workstream |
| Terrain/landscape | Phase 4 terrain patches shipped |
| Stripe billing | Checkout, portal, webhooks, tier gating |
| Governance OS | Production surface |
| Collaboration | Preview scaffold: Yjs/WebSocket + Supabase metadata/auth direction |
| AI / Gemini | Built, requires server key/env setup |
| Compliance/council/cost | Built as decision-support/prototype intelligence layers |
| Release gates | 13-gate release pipeline |
| Verification | Vitest, Playwright, route smoke, auth, billing, hardening, launch evidence |

---

## 3. Application Surface

### Public routes

| Route | Purpose |
|-------|---------|
| `/` | Marketing home |
| `/features` | Product feature catalog and guides |
| `/pricing` | Pricing and plan comparison |
| `/auth` | Supabase Auth login: Google OAuth and email link |
| `/reset-password` | Reset/password-auth support path or redirect behavior |
| `/404` | Branded not-found page |

### Private routes

| Route | Purpose |
|-------|---------|
| `/editor` | Main 2D + 3D architectural workstation |
| `/projects` | Cloud/local project library |
| `/optimization` | Design optimization dashboard |
| `/profile` | Account and billing portal |
| `/spec-center` | Locked specs and SHA-256 verification |
| `/registry` | Component/feature/tool registry |
| `/change-requests` | Governed change workflow |
| `/releases` | Release center and evidence pack surface |
| `/world-records` | Self-verified gate-count registry |
| `/audit` | Governance audit log |

### Serverless API endpoints

| Endpoint class | Purpose |
|----------------|---------|
| `api/stripe/*` | Checkout, customer portal, webhooks, entitlement writes |
| `api/ai/*` | Gemini/local parsing for site docs and requirements |
| `api/_lib/*` | Shared Stripe, Supabase auth, billing, AI, and helper libraries |

---

## 4. Core Product Modules

### A. 2D Blueprint Editor

**Status:** Production

Capabilities:

- Wall, door, window, measurement, label, dimension, room, MEP, furniture, landscape, terrain, and Vastu workflows.
- Pointer events for mouse, touch, and Apple Pencil.
- Snap-to-grid and endpoint snap.
- Parametric openings with drag handles and undo-safe commits.
- Editable room labels and area calculations.
- Local draft recovery and cloud persistence.
- Import/export flows.
- iPad-safe touch targets and keyboard/safe-area handling.

### B. Live 3D Viewport

**Status:** Production

Capabilities:

- React Three Fiber / Three.js live rendering.
- Wall extrusion from 2D manifest.
- Door/window material differentiation.
- MEP fixture lighting.
- Solar timeline.
- Atmosphere modes.
- Procedural PBR textures.
- GLTF/GLB furniture and landscape model support.
- Parametric fallback meshes when models fail.
- WebGL pre-flight and error-boundary fallback.
- Terrain extrusion from 2D drawn contour patches.

### C. Export Pipeline

**Status:** Production

| Format | Content |
|--------|---------|
| JSON | Full `ProjectManifest` round-trip |
| SVG | Vector floor plan |
| PNG | Rasterized floor plan |
| PDF | Visual floor plan + title block |
| DXF | Basic CAD line entities |
| ZIP | Permit package assembly where compliance-gated paths apply |

### D. AI Architecture Copilot

**Status:** Built, requires server/API key configuration

Capabilities:

- Site survey / boundary / council document ingestion.
- Gemini-assisted requirements extraction.
- Local parsers and requirement-merging pipeline.
- Layout solver and floor-plan generation.
- Schedules, materials, cost, compliance, and permit package outputs.

### E. Design Optimization Engine

**Status:** Built with prototype disclaimers where appropriate

Capabilities:

- Strategy-driven candidate generation.
- Multi-dimensional scoring: compliance, cost, energy, circulation, privacy, natural light, buildability, resale/permit confidence signals.
- Candidate comparison dashboard.
- Winner promotion to editor.
- Supabase/local persistence path for optimization batches.

### F. Compliance / Council / Cost Intelligence

**Status:** Built as decision-support layers

Capabilities:

- Compliance rule registry and explainable findings.
- Council requirement parsing and approval-likelihood scoring.
- Cost catalog, regional indices, labor rates, supplier pricing, risk, and confidence scoring.
- Report/export integration.

Use cautious external wording: “pre-check,” “decision support,” “readiness indicator,” and “prototype compliance assistant.” Do not claim certified compliance or guaranteed council approval.

### G. Governance Operating System

**Status:** Production

| Page | Capability |
|------|------------|
| Spec Center | Locked specs and hash verification |
| Registry | Component/feature/tool catalog |
| Change Requests | Approval/rejection/implementation workflow |
| Release Center | 13-gate release pipeline |
| World Records | Self-verified measurement evidence |
| Audit Log | Timeline of governance actions |

### H. Collaboration

**Status:** Preview scaffold

Capabilities:

- Yjs CRDT sync scaffolding.
- WebSocket presence server.
- Remote cursor overlay.
- Collaboration bar UI.
- Supabase project/collaborator metadata migration path.

Enterprise collaboration remains a high-value next milestone.

---

## 5. Platform and Infrastructure

### Technology stack

| Layer | Technology |
|-------|------------|
| UI | React 18, React Router 7 |
| Build | Vite / rolldown-vite, TypeScript 5.9 |
| Styling | Tailwind CSS, custom workstation tokens |
| UI primitives | Radix/shadcn-style components |
| 3D | Three.js, React Three Fiber, drei |
| Backend | Supabase Auth, Postgres/RLS, Storage |
| Billing | Stripe SDK/API/webhooks |
| AI | Google Gemini via serverless API routes |
| Realtime preview | Yjs, y-websocket, y-indexeddb |
| Hosting | Vercel |
| Node | 20.x pinned |

### Supabase-only production architecture

| Concern | Current production path |
|---------|--------------------------|
| Auth | Supabase Auth gateway and OAuth flow |
| Projects | Supabase project gateway |
| Governance | Supabase governance gateway |
| Optimization batches | Supabase optimization gateway |
| Billing entitlements | Supabase billing gateway / API helpers |
| Profiles | Supabase profile gateway |
| Storage | Supabase Storage for uploads/custom textures |
| Local fallback | `localStorage` project/draft recovery |

Legacy Firebase/Firebase-admin and Firestore migration artifacts should be described as historical engineering depth and migration support, not as the current live backend.

### Authentication

| Method | Current provider |
|--------|------------------|
| Passwordless email link | Supabase |
| Google OAuth | Supabase |
| Apple OAuth | Provider-config dependent / planned enterprise option |

Production auth verification should focus on the Supabase Google OAuth callback flow and post-login redirect to `/editor`.

### Monetization

| Tier | Price | Checkout | Trial |
|------|------:|----------|-------|
| Starter | Free | No | — |
| Studio | $499/month | Stripe Checkout | 14 days |
| Enterprise | $1,000/month | Stripe Checkout / sales-assisted path | None |

Stripe integration includes Checkout, Customer Portal, webhooks, tier-based export gating, co-owner entitlements, and verification scripts.

---

## 6. Quality Engineering and Operational Maturity

### Test/verification domains

- Editor core and 2D/3D parity.
- Save/load determinism.
- Governance modules.
- Import/export.
- Compliance rules.
- Optimization scoring.
- Cost intelligence.
- Council intelligence.
- Copilot ingestion.
- Planning pipeline.
- Auth/billing.
- Regression anchors.
- Route wiring.
- Cross-browser and iPad E2E surfaces.

### CI/CD and gates

Primary verification includes lint, Vercel security checks, auth gates, Supabase smoke/schema checks, launch evidence, contract gates, hardening gates, regression anchors, coverage, route smoke, build, and world-record evidence.

Quality/ops scripts cover:

- System contract enforcement.
- Forbidden module edges.
- Build gate schema.
- Auth config guards.
- Vercel security headers.
- Production hardening checks.
- Launch evidence.
- Flawless-use gates.
- Stripe billing verification.
- Supabase schema/auth verification.
- Migration helpers.
- Screenshot and page-reference packs.

---

## 7. Intellectual Property and Proprietary Logic

| Domain | Scope |
|--------|-------|
| Floor-plan engine and exporters | Manifest schema, SVG/DXF/PDF/PNG export |
| Project model | Single source of truth schema and validation |
| Building-code rules | Compliance findings and shared context |
| Optimization scoring | Strategy profiles, tradeoff scoring, moat/budget analyzers |
| Planning intelligence | Candidate generation, scoring, worker pipeline |
| AI building designer | Layout solver, adjacency solver, constraint engine |
| Floor-plan generation | Multi-stage orchestration |
| Cost intelligence | Material/labor/regional/supplier/risk/confidence systems |
| Council intelligence | Approval likelihood and planning-readiness scoring |
| Copilot ingestion | DXF/document parsers and requirement merger |
| Permit export | ZIP package assembly |
| Governance/contract layer | Spec hash, enforcer, release gates, flow schemas |
| Vastu simulation | 8-direction harmony scoring |
| Template/sample builder | Programmatic sample project generation |
| 3D scene assets | Procedural PBR + CC0 GLB-backed model registry |
| Terrain engine | 2D terrain patches + 3D extrusion |

---

## 8. Development Effort Signals

This section provides scope indicators for valuation discussions. It does not include speculative dollar amounts or invented hour estimates.

| Signal | Impact |
|--------|--------|
| Broad module surface | Indicates multi-product AEC SaaS scope |
| 2D + 3D + iPad + PWA | Higher product complexity than desktop-only drawing MVP |
| Supabase production consolidation | Reduces operator/runtime complexity |
| Firebase migration history | Demonstrates portability and data-migration depth |
| Stripe billing | Supports commercialization path |
| Governance OS | Enterprise differentiation |
| Test/gate infrastructure | Due-diligence strength |
| Documentation corpus | Handover/acquisition value |

### Backend migration and consolidation evidence

Earlier v1.2.x work implemented Firebase/Supabase migration paths and provider abstractions. Current production has consolidated to Supabase-only. This should be treated as a production simplification and risk reduction, while retaining Firebase migration artifacts as evidence of backend portability and engineering depth.

---

## 9. Production Status Matrix

| Module | Status | Notes |
|--------|--------|-------|
| 2D blueprint editor | Production | CI/E2E verified surface |
| Live 3D viewport | Production | WebGL fallback, GLB support, terrain extrusion |
| Export pipeline | Production | JSON/SVG/PNG/PDF/DXF and permit package paths |
| Auth | Production | Supabase email link + Google OAuth path |
| Projects | Production | Supabase cloud persistence + local fallback |
| Stripe billing | Production | Checkout, portal, webhooks, entitlements |
| Governance OS | Production | Specs, registry, CR, releases, audit, world records |
| Marketing pages | Production | Landing, features, pricing |
| iPad/PWA shell | Production hardening in progress | Safe-area/touch/PWA updates shipped |
| AI Designer | Built | Requires Gemini/API env setup |
| Optimization | Built | Prototype disclaimer on UI |
| Compliance engine | Built | Decision-support, not certified compliance |
| Cost intelligence | Built | Integrated into Copilot/optimization surfaces |
| Council intelligence | Built | Readiness/scoring, not approval guarantee |
| Terrain/landscape | Built | Phase 4 terrain patches shipped |
| Collaboration | Preview scaffold | Yjs/WebSocket and metadata path exist |
| SSO/SAML | Planned | Enterprise roadmap |

---

## 10. External Integrations

| Service | Integration depth | Runtime role |
|---------|-------------------|--------------|
| Supabase | Auth, Postgres/RLS, Storage, service-role server operations | Current production backend |
| Stripe | Checkout, portal, webhooks, tier gating | Monetization |
| Google Gemini | Requirements extraction and document parsing | AI/copilot server routes |
| Vercel | Hosting, serverless API routes, security headers | Deployment |
| Three.js/R3F | 3D rendering | Client runtime |
| Yjs | CRDT collaboration scaffold | Preview collaboration |
| Firebase | Legacy migration/auth artifacts only | Historical portability, not current runtime backend |

Monitoring remains a placeholder/optional integration unless `VITE_SENTRY_DSN` or other telemetry paths are explicitly configured.

---

## 11. Key Verification Commands

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
pnpm run release:gates
```

Manual smoke checklist:

1. `/auth` loads and shows Supabase auth status.
2. Google OAuth completes and redirects to `/editor`.
3. `/projects` lists cloud/local project state correctly.
4. New project save/load works.
5. Stripe checkout and portal resolve with valid auth.
6. `/editor` loads 2D + 3D surfaces.
7. Terrain tool and iPad Safari workflows work.
8. PWA install/home-screen launch does not serve stale auth shell.

---

## 12. Document Maintenance

Update this inventory whenever:

- A new major module ships.
- Test counts materially change.
- Production backend/auth provider changes.
- Billing entitlement write path changes.
- Release gate count changes.
- Public valuation or investor materials are prepared.

**Last audited:** 2026-06-13 against current v1.2.x production direction.
