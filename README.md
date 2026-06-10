# Vishvakarma.OS

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — with a strict governance operating system built in.**

[![Production](https://img.shields.io/badge/production-v1.2.0%20live-brightgreen)](https://vishvakarma-os.vercel.app)
[![CI](https://img.shields.io/badge/CI-verify%20%2B%20E2E%20%2B%20gates-brightgreen)](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27229901039)
[![Tests](https://img.shields.io/badge/tests-461%20Vitest%20%2B%2060%20Playwright-brightgreen)]()
[![Build](https://img.shields.io/badge/build-dist%2F%20confirmed-brightgreen)]()
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Firebase-informational)]()
[![Gates](https://img.shields.io/badge/release%20gates-13%2F13%20strict-blueviolet)]()
[![UI](https://img.shields.io/badge/UI-gold%20workstation-blueviolet)]()

---

## What is Vishvakarma.OS?

Vishvakarma.OS is a browser-native architectural design tool that combines a **2D blueprint canvas** with a **live 3D model chamber**, wrapped in a governance operating system that enforces spec compliance, change control, audit logging, and release gating.

It is designed as a professional architectural OS — not just a drawing app. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is logged in an immutable audit trail.

---

## Current Build State

**Version:** v1.2.0 · **Production launch:** 2026-06-09 · **Status:** Public pilot allowed

**Live:** [vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app) · Firebase `gen-lang-client-0690161780` · email-link auth + Firestore rules deployed

**CI (release commit):** [Verify Vishvakarma.OS run 27229901039](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27229901039) — verify · Playwright E2E · release gate manifest all green

### Verified Pipeline

| Stage | Command | Result |
|---|---|---|
| **Lint** | `pnpm run lint` | Biome + tsgo + ast-grep |
| **Tests** | `pnpm run test` | Vitest — 461 tests (48 files) |
| **E2E** | `pnpm run test:e2e` | Playwright — 60 tests (21 auth-gate + 39 app-smoke) |
| **Cross-browser** | `pnpm run test:e2e:cross-browser` | Firefox smoke (WebKit on Linux/macOS CI) |
| **A11y** | `pnpm run test:e2e:a11y` | axe-playwright WCAG 2.1 AA scan |
| **Build** | `pnpm run build` | Production build → `dist/` |
| **Verify** | `pnpm run verify:ci` | lint → coverage → routes → build |
| **Release gates** | `pnpm run release:gates:strict` | 13/13 gates — exit 0 |
| **Launch evidence** | `pnpm run launch:evidence:strict` | Operator evidence ledger — exit 0 |
| **World record** | `pnpm run record:measure` | Gate count artifact → `docs/world-record/` |
| **Page references** | `pnpm run capture:page-references` | 31 UI screenshots → `docs/design/page-references/` |

### Verified Working ✅

| Component | Status | Evidence |
|---|---|---|
| **Lint pipeline** | ✅ Verified | `pnpm run lint` — Biome + `tsgo` + ast-grep |
| **Test suite** | ✅ Verified | `pnpm run test` — 461 Vitest tests + 60 Playwright E2E (local + CI) |
| **Production build** | ✅ Verified | `pnpm run build` → `dist/` |
| **2D Blueprint Editor** | ✅ Built | Wall/door/window drawing, gold endpoint snap ring, opening drag handles, labels (`T`), dimensions (`⇧M` / ⇧D toggle), furniture (`F`), MEP + lighting fixtures, room detect, snap-to-grid, undo/redo (50 states) |
| **3D Viewport** | ✅ Built | React Three Fiber — wall extrusion, semi-transparent red doors + gold windows, fixture lights, furniture boxes, solar lighting, custom texture materials, WebGL error boundary |
| **ToolRail** | ✅ Built + Tested | Select, Wall, Door, Window, Measure, Text, Dimension, Room, MEP, Furniture, Landscape, Vastu |
| **Properties Panel** | ✅ Built | Wall/opening inspector, label font/color editor, room area display |
| **Solar Timeline** | ✅ Built | Sun azimuth/elevation sliders, intensity control |
| **Material Picker** | ✅ Built | Presets + custom materials via `CustomMaterialDialog`; optional Firebase texture upload |
| **Export Package** | ✅ Built | JSON · PNG · PDF (recommended) · DXF · SVG — shared `floorPlanSvg` builder for visual formats |
| **Visual PDF export** | ✅ Built | Rasterized floor plan with openings, labels, and dimensions (A4/Letter) |
| **Projects page** | ✅ Built | Search, archive, duplicate, cloud + local project list |
| **Keyboard Shortcuts** | ✅ Built | `KeyboardShortcuts.tsx` (4 KB) — shortcut reference dialog |
| **App Layout** | ✅ Built | `AppLayout.tsx` — responsive sidebar (desktop) + Sheet drawer (mobile), grouped nav sections, active indicators |
| **All 15 Routes** | ✅ Built | Public marketing + private editor/governance routes — `/pricing` when `VITE_PRICING_PAGE_ENABLED=true` (default in `.env.example`) — see Application Routes |
| **World Records** | ✅ Built | `WorldRecordsPage.tsx` — 12 metric gates (gates 1–12), 13-gate release pipeline, measurement artifact, honesty disclaimer |
| **Workspace Command Palette** | ✅ Built | `WorkspaceCommandPalette.tsx` — quick navigation across editor and governance routes |
| **Analytics Consent** | ✅ Built | Opt-in banner pattern via `AnalyticsConsentBanner.tsx` |
| **Extended ToolRail** | ✅ Built | Room, Vastu, MEP, Furniture, Landscape tools wired to canvas + 3D |
| **OAuth Sign-in** | ✅ Production | Email link (passwordless) on live site; Google/Apple when enabled in Firebase Console |
| **Firebase production** | ✅ Connected | Vercel env vars set; Firestore rules deployed; authorized domain `vishvakarma-os.vercel.app` |
| **Collaboration bar** | ✅ Built | Local session presence; Firebase Realtime planned for v2 |
| **Spec Center** | ✅ Built | `SpecCenterPage.tsx` (10 KB) — locked spec cards, SHA-256 hash display, stats row |
| **Registry** | ✅ Built | `RegistryPage.tsx` (12 KB) — entry cards with type icons, grid layout, improved empty state with "view all" action |
| **Change Requests** | ✅ Built | `ChangeRequestsPage.tsx` (15 KB) — priority badges, status workflow, tab counts, improved empty states with CTAs |
| **Releases** | ✅ Built | `ReleasesPage.tsx` — live verification health banner (lint/test/build status), gate progress, stop-ship list, build status hero |
| **Audit Log** | ✅ Built | `AuditLogPage.tsx` (8 KB) — timeline layout, date grouping, action badges, empty state with editor CTA |
| **Core Modules** | ✅ Built | 11 modules — canvas engine, governance lock, version control, export/import, format validator, theme manager, accessibility layer, collaboration engine, element lock, multi-user governance |
| **Design System** | ✅ Built | `index.css` (~530 lines) — gold workstation tokens, always-dark editor chrome, light governance panels, semantic colours |
| **Firebase Layer** | ✅ Built | `src/backend/firebase/` — Firestore CRUD via `src/db/api.ts` |
| **Onboarding** | ✅ Built | First-run panel on empty editor canvas with sample project CTA and new project CTA |
| **Save Mode Badge** | ✅ Built | Firebase / Local mode pill shown in editor toolbar |
| **2D→3D Sync Indicator** | ✅ Built | Pulse indicator in editor toolbar fires when walls/openings change |

### Known Limitations ⚠️

| Area | Status | Notes |
|---|---|---|
| **Firebase persistence** | ✅ Production / ⚠️ local | Production uses Vercel Firebase env vars. Local dev needs real values in `.env.local` — otherwise local-only mode (full editor, no cloud save). |
| **Real-time collaboration** | ⚠️ Stubbed | `collaborationEngine.ts` exists and is unit-tested; production Realtime wiring planned for v2. |
| **Bundle size** | ⚠️ Large | 1.5 MB JS chunk — Three.js and React Three Fiber are the main contributors. Code-splitting is a future optimisation. |

### File Inventory

```
247  TypeScript / TSX source files (src/)
  1  Global CSS + workstation design tokens
 62  Test files (Vitest + Playwright e2e/)
 31  Page-reference screenshots (marketing / editor / workspace / governance)
 11  Core modules (src/modules/)
  1  Firebase gateway layer (src/backend/firebase/)
  1  Firebase project link (.firebaserc → gen-lang-client-0690161780)
  1  Route manifest (src/routes.tsx)
 13  Release gates (src/governance/gates/gate-manifest.json)
```

---

## Core Features

### Blueprint Editor
- Interactive 2D canvas with snap-to-grid, endpoint snap, and cached grid layer
- **Tools**: Select (V) · Wall (W) · Door (D) · Window (N) · Measure (M) · Text (T) · Dimension (⇧M) · Furniture (F) · Room · MEP · Landscape · Vastu
- Drag-to-reposition openings with live position % and undo-safe commit
- Editable room labels (double-click) with font/color in properties panel
- Persistent dimension annotations with leader lines; toggle visibility with ⇧D
- Custom materials, furniture placement with drag, room auto-detect with area
- Undo / redo with full history stack
- Save and load via Firebase Firestore or local draft recovery
- Gold corner-join snap ring when wall endpoints align during preview
- Export: JSON · PNG · **visual PDF** · DXF · **SVG** · Import from JSON/SVG
- Load sample project for instant onboarding

### 3D Model Chamber
- Live React Three Fiber viewport — updates as you draw in 2D
- Semi-transparent red doors (`#C85A54`) and gold windows (`#D4A13D`) on extruded walls
- OrbitControls for pan, orbit, zoom
- Directional sun lighting with azimuth and elevation control (solar timeline)
- Material presets: paint, wood, concrete; optional custom texture maps
- MEP lighting fixtures render as point/spot lights in 3D
- **WebGL error boundary**: two-layer defence (pre-flight capability check + React error boundary) — if WebGL is unavailable the app continues running with a graceful fallback panel; no blank page, no crash

### Governance OS

| Module | Path | Purpose |
|---|---|---|
| Spec Center | `/spec-center` | Locked specifications with SHA-256 hash verification |
| Registry | `/registry` | Component, feature and tool registry |
| Change Requests | `/change-requests` | Structured change workflow — pending → approved → implemented |
| Release Center | `/releases` | Multi-gate release pipeline with stop-ship enforcement |
| World Records | `/world-records` | Self-verified gate-count claim and measurement artifact |
| Audit Log | `/audit` | Immutable chronological event timeline |

---

## Application Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing home |
| `/features` | Features & Guides | Product reference |
| `/pricing` | Pricing | Plans |
| `/auth` | Account Access | Email link + Google/Apple OAuth |
| `/reset-password` | Reset Password | Password reset flow (redirects to auth when unconfigured) |
| `/404` | Not Found | Unknown route fallback |
| `/editor` | Blueprint Editor | Main 2D + 3D workspace |
| `/projects` | Projects | Cloud/local project list |
| `/profile` | Profile | Account + sign-out |
| `/spec-center` | Spec Center | Locked governing specifications |
| `/registry` | Registry Center | Component and feature inventory |
| `/change-requests` | Change Requests | Governed change workflow |
| `/releases` | Release Center | Gate-checked release pipeline |
| `/audit` | Audit Log | Full system event timeline |
| `/world-records` | World Records | Self-verified gate-count registry + measurement artifact |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite (rolldown-vite) |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v3 + CSS custom properties |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Backend / DB | Firebase (Auth + Firestore) |
| Forms | React Hook Form + Zod |
| Routing | React Router v7 |
| Notifications | Sonner |
| Icons | Lucide React |
| Linting | Biome + TypeScript native (`tsgo`) |
| Testing | Vitest + Testing Library |
| Animation | Motion (Framer Motion) |

---

## Design System

Vishvakarma.OS uses a **gold workstation** visual language — dark editor chrome with light governance panels:

- **Editor chrome**: always-dark canvas, toolbar, and status bar (`--ws-*` tokens)
- **Governance panels**: light page background with white cards and muted borders
- **Primary accent**: metallic gold (`#D4AF37` / `--primary`) for active tools, rings, and sidebar highlights
- **Blueprint surface**: warm paper tone (`--ws-canvas-surface`) on the 2D drafting grid
- **Sidebar**: fixed dark navigation rail with gold active indicators
- **Elevation system**: shadow-sm → shadow-md → shadow-lg → shadow-glow
- **Typography**: Inter UI + optional Devanagari display class
- **Touch targets**: minimum 44×44 px (iPad-first)
- **Scrollbar**: thin custom scrollbar in both webkit and Firefox
- **Semantic tokens only** — no raw Tailwind colour classes in components

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── BlueprintCanvas.tsx     # 2D drawing canvas
│   │   │   ├── Viewport3D.tsx          # Three.js 3D viewport (WebGL error boundary)
│   │   │   ├── ToolRail.tsx            # Drawing tool dock
│   │   │   ├── PropertiesPanel.tsx     # Wall / opening inspector
│   │   │   ├── MaterialPicker.tsx      # Material preset selector
│   │   │   ├── SolarTimeline.tsx       # Sun position controller
│   │   │   └── KeyboardShortcuts.tsx   # Shortcut reference dialog
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx           # Sidebar + mobile sheet navigation
│   │   └── ui/                         # shadcn/ui primitives (do not modify)
│   ├── pages/
│   │   ├── EditorPage.tsx              # Blueprint editor workspace
│   │   ├── SpecCenterPage.tsx          # Governance specs
│   │   ├── RegistryPage.tsx            # Component registry
│   │   ├── ChangeRequestsPage.tsx      # Change request workflow
│   │   ├── ReleasesPage.tsx            # Release gate dashboard
│   │   ├── AuditLogPage.tsx            # Event audit timeline
│   │   └── WorldRecordsPage.tsx        # World record registry
│   ├── governance/
│   │   ├── gates/                      # 13-gate release manifest
│   │   └── records/                    # World record measurement registry
│   ├── backend/
│   │   └── firebase/                   # Firestore gateways + retry
│   ├── db/
│   │   └── api.ts                      # Project/governance API facade
│   ├── modules/                        # Core business modules
│   ├── hooks/                          # Custom React hooks
│   ├── types/                          # TypeScript type definitions
│   ├── routes.tsx                      # Centralised route manifest
│   ├── App.tsx                         # Root app + router
│   └── index.css                       # Design tokens + global styles
├── docs/                               # Extended documentation
│   ├── SPEC.md                         # Blueprint editor specification (locked)
│   ├── design/page-references/         # 31 Playwright UI screenshots
│   ├── user/                           # Getting Started, Tool Reference, FAQ
│   ├── release/                        # Deployment, Vercel env, evidence pack
│   ├── world-record/                   # Gate-count claim + measurement artifacts
│   ├── v2/                             # v2.0 architecture notes
│   ├── rfc/                            # Feature backlog RFCs
│   └── GOVERNANCE_QUICKSTART.md        # Governance system guide
├── MIGRATION.md                        # Version upgrades + Firebase cutover
├── SECURITY.md                         # Security policy
├── CONTRIBUTING.md                     # Contributor guide
├── CHANGELOG.md                        # Version history
├── .firebaserc                         # Linked Firebase project (gen-lang-client-0690161780)
├── firebase.json                       # Firestore rules + auth provider config
├── firestore.rules                     # Firestore security rules
├── scripts/
│   ├── verify-all.js                   # 13-gate release verification
│   ├── setup-firebase-auth-config.mjs  # Email link + authorized domains (operator)
│   └── world-record/measure-record.mjs # Gate-count measurement artifact
├── public/
│   └── samples/                        # Sample project JSON files
├── tailwind.config.js                  # Tailwind + design token config
├── biome.json                          # Biome linter config
└── vitest.config.ts                    # Test runner config
```

---

## Local Development

### Requirements

- **Node.js** ≥ 20 (see `.nvmrc`)
- **pnpm** 9.15.0 (recommended; enforced via `packageManager`)

### Setup

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start the development server
pnpm run dev

# 4. Run the full verification pipeline (lint → test → build)
pnpm run verify:ci

# Or run stages individually
pnpm run lint
pnpm run test
pnpm run build
pnpm run preview   # serve the production build locally
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Auth + Firestore (required for cloud save/sign-in)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Optional
# VITE_FIREBASE_STORAGE_BUCKET=
# VITE_FIREBASE_MESSAGING_SENDER_ID=
```

Without Firebase env vars, the app runs in **local-only mode**: full editor features, local draft recovery, and browser-stored projects. See [`docs/user/GETTING_STARTED.md`](docs/user/GETTING_STARTED.md).

Validate local config:

```bash
pnpm run production:verify-env --strict
```

---

## Firebase Backend

**Project:** `gen-lang-client-0690161780` (display name: vishvakarma-os) · **Web app:** Vishvakarma.OS

Vishvakarma.OS uses **Firebase Auth + Firestore** for persistence:

| Collection | Purpose |
|---|---|
| `projects` | Blueprint project manifests |
| `specs` | Locked governance specifications |
| `registry_entries` | Component and feature registry |
| `change_requests` | Change request workflow records |
| `releases` | Release version records |
| `audit_logs` | Immutable system event log |

**Operator setup** (after linking `.firebaserc`):

```bash
npx -y firebase-tools@latest login          # or Firebase MCP auth flow
npx -y firebase-tools@latest deploy --only firestore:rules
pnpm run setup:firebase-auth                # email link + authorized domains
pnpm run setup:firebase-auth:full           # deploy auth + restore passwordless email
pnpm run test:firebase-auth                 # quota-safe config check (no live email send)
```

**Important:** After `firebase deploy --only auth`, always run `pnpm run setup:firebase-auth` — the deploy can reset email to password-required mode.

Auth on production enables **Email link (passwordless)** with authorized domains: `vishvakarma-os.vercel.app`, `localhost`, and default Firebase hosting domains.

See [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) and [`MIGRATION.md`](MIGRATION.md).

---

## Scripts & Quality

```bash
pnpm run dev                    # Vite dev server on 127.0.0.1
pnpm run build                  # Production build → dist/
pnpm run preview                # Serve dist/ locally on :4173
pnpm run test                   # Vitest unit/integration suite
pnpm run test:e2e               # Playwright auth-gate + app-smoke (60 tests)
pnpm run test:e2e:cross-browser # Firefox + WebKit smoke
pnpm run test:e2e:a11y          # WCAG 2.1 AA axe audit
pnpm run test:coverage          # Vitest with v8 coverage report
pnpm run lint                   # tsgo + Biome + ast-grep
pnpm run verify:ci              # lint → test → routes → build
pnpm run release:gates          # 13-gate release manifest
pnpm run release:gates:strict   # Strict mode — exit 0 required for public launch
pnpm run launch:evidence:strict # Operator evidence ledger validation
pnpm run record:measure         # World record gate-count artifact
pnpm run capture:page-references  # Regenerate UI screenshot pack
pnpm run ci                     # Full CI pipeline (coverage + routes + build)
pnpm run verify                 # lint + auth/flawless gates + launch evidence + test + build
pnpm run production:evidence    # Generate production evidence bundle
pnpm run production:verify-env  # Check .env.example / .env.local Firebase keys
pnpm run setup:firebase-auth    # Configure email link + authorized domains
pnpm run test:firebase-auth     # Quota-safe Firebase auth config smoke test
pnpm run test:firebase-auth:full  # Includes live email send (consumes daily quota)
```

The linter enforces:
- TypeScript strict mode — no implicit `any`, no unused variables
- No undeclared dependencies (Biome `noUndeclaredDependencies`)
- Structural rules via ast-grep patterns
- Semantic design tokens only — no raw colour utility classes in component files

---

## WebGL & 3D Resilience

The 3D viewport uses a two-layer WebGL failure defence:

1. **Pre-flight check** (`detectWebGL()`) — probes for `webgl2`, `webgl`, and `experimental-webgl` context support before mounting the Three.js Canvas at all
2. **React Error Boundary** (`WebGLErrorBoundary`) — catches any exception thrown during or after Canvas mount, including the `BindToCurrentSequence` failure reported on some headless / sandboxed environments

If either layer triggers, a graceful fallback panel is displayed and the rest of the application — including the full 2D blueprint editor — continues running normally.

---

## Governance Model

Vishvakarma.OS enforces a **no-drift governance model**:

- All UI elements must be declared in the spec before implementation
- Changes to locked specs require an approved Change Request
- Release gates must all pass (or be explicitly waived with documented reason)
- Gate 13 requires a machine-readable world record measurement artifact
- Every system action is written to the audit log
- Stop-ship violations block the release pipeline

See [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) for the full governance workflow.

### World Record Claim

Vishvakarma.OS tracks a **self-verified** claim for most enforced pre-release compliance gates in a browser-native architectural floor plan editor. This is **not** an official Guinness World Records title until GWR adjudication completes.

```bash
pnpm run record:measure   # writes docs/world-record/latest-measurement.json
```

See [`docs/world-record/WORLD_RECORD_CLAIM.md`](docs/world-record/WORLD_RECORD_CLAIM.md) for metric definition, inclusion rules, and honesty statement.

---

## Browser Support

| Browser | Minimum Version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

**WebGL 2** is preferred for full 3D rendering. WebGL 1 is accepted as a fallback. If neither is available the app degrades gracefully to 2D-only mode.

---

## Production deployment (Vercel)

**v1.2.0** — live at [https://vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app)

Launch clearance: [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md) · evidence ledger [`docs/release/evidence/EVIDENCE_MANIFEST.md`](docs/release/evidence/EVIDENCE_MANIFEST.md)

Configure **Production** Firebase env vars in Vercel (see [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md)):

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_APP_ID` | App ID |

Then deploy Firestore rules, configure auth, and validate:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
pnpm run setup:firebase-auth
pnpm run production:verify-env --strict
pnpm run release:gates
vercel deploy --prod --yes   # redeploy after env changes (Vite inlines at build time)
```

**Production checklist (v1.2.0):** Vercel `VITE_FIREBASE_*` vars set · Firestore rules deployed · email-link auth enabled · `vishvakarma-os.vercel.app` authorized · CSP/HSTS headers live · cloud save/load operator proof attached · strict gates 13/13 · CI green on release commit.

Full operator guide: [`docs/release/DEPLOYMENT.md`](docs/release/DEPLOYMENT.md)

---

## Platform

- **iPad-first** — all touch targets ≥ 44×44 px
- **Desktop** — full sidebar navigation, hover states, keyboard shortcuts
- **Mobile** — hamburger menu + Sheet drawer, responsive canvas
- Minimum viewport: 375 px width

---

## Documentation

| Document | Description |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | Blueprint editor governing specification (locked) |
| [`docs/design/page-references/PAGE_REFERENCE.md`](docs/design/page-references/PAGE_REFERENCE.md) | 31 UI screenshots — regenerate with `pnpm run capture:page-references` |
| [`docs/user/GETTING_STARTED.md`](docs/user/GETTING_STARTED.md) | Setup and first project |
| [`docs/user/KEYBOARD_SHORTCUTS.md`](docs/user/KEYBOARD_SHORTCUTS.md) | Editor keyboard reference |
| [`docs/user/TOOL_REFERENCE.md`](docs/user/TOOL_REFERENCE.md) | Tool guide |
| [`docs/release/DEPLOYMENT.md`](docs/release/DEPLOYMENT.md) | Production deployment guide |
| [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) | Vercel Firebase env vars |
| [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) | Governance quick-start |
| [`docs/REGISTRY.md`](docs/REGISTRY.md) | Registry documentation |
| [`docs/README.md`](docs/README.md) | Extended architecture overview |
| [`docs/PRODUCT_CAPABILITIES.md`](docs/PRODUCT_CAPABILITIES.md) | Audited 5-section capability brief (launch copy source of truth) |
| [`docs/world-record/WORLD_RECORD_CLAIM.md`](docs/world-record/WORLD_RECORD_CLAIM.md) | Self-verified gate-count claim |
| [`docs/world-record/GUINNESS_APPLICATION.md`](docs/world-record/GUINNESS_APPLICATION.md) | GWR application draft |
| [`docs/v2/ARCHITECTURE.md`](docs/v2/ARCHITECTURE.md) | v2.0 architecture notes |
| [`docs/rfc/README.md`](docs/rfc/README.md) | Feature backlog RFC index |
| [`NEXT_STEPS.md`](NEXT_STEPS.md) | Roadmap and release gates |
| [`CHANGELOG.md`](CHANGELOG.md) | Full version history |
| [`MIGRATION.md`](MIGRATION.md) | Upgrade and Firebase cutover guide |
| [`SECURITY.md`](SECURITY.md) | Security policy |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contributor guide |

---

## Changelog — v1.2.0 production (2026-06-09)

- **Public pilot launch cleared** — `release:gates:strict` + `launch:evidence:strict` exit 0; CI run [27229901039](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27229901039) green
- UI polish pass — gold workstation marketing pages, metric pills, floor switcher, project thumbnails, accessibility contrast fixes
- E2E battery hardened — 60 Playwright tests, cross-browser Firefox smoke, axe WCAG audit, 31 page-reference screenshots regenerated
- Sample-save fix — loading demo blueprint no longer clears active project before save
- Operator evidence pack — Firebase production, security headers, iPad touch audit, 2D/3D parity, save/load determinism ([`docs/release/evidence/`](docs/release/evidence/))
- Product capability audit — [`docs/PRODUCT_CAPABILITIES.md`](docs/PRODUCT_CAPABILITIES.md)

## Changelog — v1.2 polish (2026-06-08)

- MEP lighting fixtures (point/spot/ceiling) in 2D + 3D; dimension visibility chip (⇧D)
- Custom material texture upload via Firebase Storage; export fidelity (openings in PNG/PDF/SVG)
- SVG export in Export Package dialog; pricing page flag (`VITE_PRICING_PAGE_ENABLED=true`)

## Changelog — v1.1.1 (2026-06-08)

- Visual PDF export, opening drag handles, editable labels, dimension leader lines
- Custom materials, furniture picker (`F`), projects search/archive/duplicate
- Firebase-only docs, 13-gate manifest (Gate 13 = world record evidence), save/load + parity tests
- **Firebase production wired:** `.firebaserc`, Vercel env vars, Firestore rules, email-link auth, `pnpm run setup:firebase-auth`
- World Records route, measurement script (`pnpm run record:measure`), honesty disclaimer
- Workspace command palette, analytics consent banner, monitoring scaffold
- Governance docs (MIGRATION, SECURITY, DEPLOYMENT) and page reference pack (31 captures)

See [`CHANGELOG.md`](CHANGELOG.md) for full history.
