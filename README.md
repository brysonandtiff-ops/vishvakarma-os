# Vishvakarma.OS

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — with a strict governance operating system built in.**

[![Lint](https://img.shields.io/badge/lint-0%20errors%20·%20127%20files-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-brightgreen)]()
[![Build](https://img.shields.io/badge/build-dist%2F%20confirmed-brightgreen)]()
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Firebase-informational)]()
[![WebGL](https://img.shields.io/badge/WebGL-error%20bounded-brightgreen)]()
[![UI](https://img.shields.io/badge/UI-premium%20dark%20glass-blueviolet)]()

---

## What is Vishvakarma.OS?

Vishvakarma.OS is a browser-native architectural design tool that combines a **2D blueprint canvas** with a **live 3D model chamber**, wrapped in a governance operating system that enforces spec compliance, change control, audit logging, and release gating.

It is designed as a professional architectural OS — not just a drawing app. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is logged in an immutable audit trail.

---

## Current Build State

**Version:** v1.1.1 · **Last updated:** 2026-06-08

### Verified Pipeline

| Stage | Command | Result |
|---|---|---|
| **Lint** | `pnpm run lint` | Biome + tsgo + ast-grep |
| **Tests** | `pnpm run test` | Vitest unit/integration suite (400+ tests) |
| **E2E** | `pnpm run test:e2e` | Playwright auth-gate + app-smoke |
| **Build** | `pnpm run build` | Production build → `dist/` |
| **Verify** | `pnpm run verify:ci` | lint → coverage → routes → build |
| **Release gates** | `pnpm run release:gates` | 13-gate manifest (automated + evidence) |
| **Page references** | `pnpm run capture:page-references` | 31 UI screenshots → `docs/design/page-references/` |

### Verified Working ✅

| Component | Status | Evidence |
|---|---|---|
| **Lint pipeline** | ✅ Verified | `pnpm run lint` — Biome + `tsgo` + ast-grep |
| **Test suite** | ✅ Verified | `pnpm run test` — Vitest + Playwright E2E |
| **Production build** | ✅ Verified | `pnpm run build` → `dist/` |
| **2D Blueprint Editor** | ✅ Built | Wall/door/window drawing, opening drag handles, labels (`T`), dimensions (`⇧M`), furniture (`F`), room detect, snap-to-grid, undo/redo |
| **3D Viewport** | ✅ Built | React Three Fiber — wall extrusion, furniture boxes, solar lighting, WebGL error boundary |
| **ToolRail** | ✅ Built + Tested | Select, Wall, Door, Window, Measure, Text, Dimension, Room, MEP, Furniture, Landscape, Vastu |
| **Properties Panel** | ✅ Built | Wall/opening inspector, label font/color editor, room area display |
| **Solar Timeline** | ✅ Built | Sun azimuth/elevation sliders, intensity control |
| **Material Picker** | ✅ Built | Presets + custom materials via `CustomMaterialDialog` |
| **Visual PDF export** | ✅ Built | Rasterized floor plan with labels and dimensions (A4/Letter) |
| **Projects page** | ✅ Built | Search, archive, duplicate, cloud + local project list |
| **Keyboard Shortcuts** | ✅ Built | `KeyboardShortcuts.tsx` (4 KB) — shortcut reference dialog |
| **App Layout** | ✅ Built | `AppLayout.tsx` — responsive sidebar (desktop) + Sheet drawer (mobile), grouped nav sections, active indicators |
| **All 15 Routes** | ✅ Built | Public marketing + private editor/governance routes — see Application Routes |
| **Extended ToolRail** | ✅ Built | Room, Vastu, MEP, Furniture, Landscape tools wired to canvas + 3D |
| **OAuth Sign-in** | ✅ Built | Google/Apple via Firebase when backend configured |
| **Collaboration bar** | ✅ Built | Local session presence; Firebase Realtime planned for v2 |
| **Spec Center** | ✅ Built | `SpecCenterPage.tsx` (10 KB) — locked spec cards, SHA-256 hash display, stats row |
| **Registry** | ✅ Built | `RegistryPage.tsx` (12 KB) — entry cards with type icons, grid layout, improved empty state with "view all" action |
| **Change Requests** | ✅ Built | `ChangeRequestsPage.tsx` (15 KB) — priority badges, status workflow, tab counts, improved empty states with CTAs |
| **Releases** | ✅ Built | `ReleasesPage.tsx` — live verification health banner (lint/test/build status), gate progress, stop-ship list, build status hero |
| **Audit Log** | ✅ Built | `AuditLogPage.tsx` (8 KB) — timeline layout, date grouping, action badges, empty state with editor CTA |
| **Core Modules** | ✅ Built | 12 modules — canvas engine, governance lock, version control, export/import, format validator, theme manager, accessibility layer, collaboration engine, element lock, multi-user governance |
| **Design System** | ✅ Built | `index.css` (288 lines) — dark/light mode tokens, glass panels, glow effects, elevation system, semantic colours |
| **Firebase Layer** | ✅ Built | `src/backend/firebase/` — Firestore CRUD via `src/db/api.ts` |
| **Onboarding** | ✅ Built | First-run panel on empty editor canvas with sample project CTA and new project CTA |
| **Save Mode Badge** | ✅ Built | Firebase / Local mode pill shown in editor toolbar |
| **2D→3D Sync Indicator** | ✅ Built | Pulse indicator in editor toolbar fires when walls/openings change |

### Known Limitations ⚠️

| Area | Status | Notes |
|---|---|---|
| **Firebase persistence** | ⚠️ Config-dependent | Requires `VITE_FIREBASE_*` vars. App works in local-only mode without them — cloud save unavailable but all editing features function. |
| **Real-time collaboration** | ⚠️ Stubbed | `collaborationEngine.ts` exists and is unit-tested; production Realtime wiring planned for v2. |
| **Bundle size** | ⚠️ Large | 1.5 MB JS chunk — Three.js and React Three Fiber are the main contributors. Code-splitting is a future optimisation. |

### File Inventory

```
130+ TypeScript / TSX source files
  1  Global CSS + sacred design tokens
 55+ Test files (Vitest + Playwright)
 31  Page-reference screenshots (marketing / editor / workspace / governance)
 12  Core modules
  1  Firebase gateway layer (src/backend/firebase/)
  1  Route manifest
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
- Export: JSON · PNG · **visual PDF** · DXF · Import from JSON/SVG
- Load sample project for instant onboarding

### 3D Model Chamber
- Live React Three Fiber viewport — updates as you draw in 2D
- OrbitControls for pan, orbit, zoom
- Directional sun lighting with azimuth and elevation control (solar timeline)
- Material presets: paint, wood, concrete
- **WebGL error boundary**: two-layer defence (pre-flight capability check + React error boundary) — if WebGL is unavailable the app continues running with a graceful fallback panel; no blank page, no crash

### Governance OS

| Module | Path | Purpose |
|---|---|---|
| Spec Center | `/spec-center` | Locked specifications with SHA-256 hash verification |
| Registry | `/registry` | Component, feature and tool registry |
| Change Requests | `/change-requests` | Structured change workflow — pending → approved → implemented |
| Release Center | `/releases` | Multi-gate release pipeline with stop-ship enforcement |
| Audit Log | `/audit` | Immutable chronological event timeline |

---

## Application Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing home |
| `/features` | Features & Guides | Product reference |
| `/pricing` | Pricing | Plans |
| `/auth` | Account Access | Email link + Google/Apple OAuth |
| `/editor` | Blueprint Editor | Main 2D + 3D workspace |
| `/projects` | Projects | Cloud/local project list |
| `/profile` | Profile | Account + sign-out |
| `/spec-center` | Spec Center | Locked governing specifications |
| `/registry` | Registry Center | Component and feature inventory |
| `/change-requests` | Change Requests | Governed change workflow |
| `/releases` | Release Center | Gate-checked release pipeline |
| `/audit` | Audit Log | Full system event timeline |
| `/world-records` | World Records | In-app registry |

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

Vishvakarma.OS uses a **premium dark glass architectural command center** visual language:

- **Dark mode**: deep graphite background (`#0d0f12`) with electric cyan primary accent
- **Light mode**: blueprint drafting table — warm white with slate blue accents
- **Glass panels**: `backdrop-blur` frosted surface cards
- **Elevation system**: 4 levels — surface → raised → overlay → glow
- **Typography**: clean technical UI, `text-balance` on all headings
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
│   │   └── AuditLogPage.tsx            # Event audit timeline
│   ├── backend/
│   │   └── firebase/                   # Firestore gateways + retry
│   ├── db/
│   │   └── api.ts                      # Project/governance API facade
│   ├── modules/                        # Core business modules
│   ├── governance/                     # Governance lock + validation
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
│   └── GOVERNANCE_QUICKSTART.md        # Governance system guide
├── MIGRATION.md                        # Version upgrades + Firebase cutover
├── SECURITY.md                         # Security policy
├── CONTRIBUTING.md                     # Contributor guide
├── CHANGELOG.md                        # Version history
├── scripts/
│   ├── verify-gates.cjs                # Release gate verification
│   ├── verify-all.js                   # Full system verification
│   └── enforce-build.js                # Build enforcement script
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

---

## Firebase Backend

Vishvakarma.OS uses **Firebase Auth + Firestore** for persistence:

| Collection | Purpose |
|---|---|
| `projects` | Blueprint project manifests |
| `specs` | Locked governance specifications |
| `registry_entries` | Component and feature registry |
| `change_requests` | Change request workflow records |
| `releases` | Release version records |
| `audit_logs` | Immutable system event log |

Deploy rules: `firebase deploy --only firestore:rules`. See [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) and [`MIGRATION.md`](MIGRATION.md).

---

## Scripts & Quality

```bash
pnpm run dev                    # Vite dev server on 127.0.0.1
pnpm run build                  # Production build → dist/
pnpm run preview                # Serve dist/ locally on :4173
pnpm run test                   # Vitest unit/integration suite
pnpm run test:e2e               # Playwright auth-gate + app-smoke
pnpm run test:coverage          # Vitest with v8 coverage report
pnpm run lint                   # tsgo + Biome + ast-grep
pnpm run verify:ci              # lint → test → routes → build
pnpm run release:gates          # 13-gate release manifest
pnpm run capture:page-references  # Regenerate UI screenshot pack
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
- Every system action is written to the audit log
- Stop-ship violations block the release pipeline

See [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) for the full governance workflow.

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

Live site: [https://vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app)

Configure **Production** Firebase env vars in Vercel (see [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md)):

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_APP_ID` | App ID |

Then deploy Firestore rules and validate:

```bash
firebase deploy --only firestore:rules
pnpm run production:verify-env
pnpm run release:gates
```

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
| [`NEXT_STEPS.md`](NEXT_STEPS.md) | Roadmap and release gates |
| [`CHANGELOG.md`](CHANGELOG.md) | Full version history |
| [`MIGRATION.md`](MIGRATION.md) | Upgrade and Firebase cutover guide |
| [`SECURITY.md`](SECURITY.md) | Security policy |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contributor guide |

---

## Changelog — v1.1.1 (2026-06-08)

- Visual PDF export, opening drag handles, editable labels, dimension leader lines
- Custom materials, furniture picker (`F`), projects search/archive/duplicate
- Firebase-only docs, 13-gate manifest, save/load + parity automated tests
- Monitoring/analytics scaffold, governance docs (MIGRATION, SECURITY, DEPLOYMENT)
- Page reference screenshot pack refreshed (31 captures)

See [`CHANGELOG.md`](CHANGELOG.md) for full history.
