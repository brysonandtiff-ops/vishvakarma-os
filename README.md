# Vishvakarma.OS

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — with a strict governance operating system built in.**

[![Lint](https://img.shields.io/badge/lint-0%20errors%20·%20127%20files-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-382%20%2F%20382%20passing-brightgreen)]()
[![Build](https://img.shields.io/badge/build-dist%2F%20confirmed-brightgreen)]()
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Supabase-informational)]()
[![WebGL](https://img.shields.io/badge/WebGL-error%20bounded-brightgreen)]()
[![UI](https://img.shields.io/badge/UI-premium%20dark%20glass-blueviolet)]()

---

## What is Vishvakarma.OS?

Vishvakarma.OS is a browser-native architectural design tool that combines a **2D blueprint canvas** with a **live 3D model chamber**, wrapped in a governance operating system that enforces spec compliance, change control, audit logging, and release gating.

It is designed as a professional architectural OS — not just a drawing app. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is logged in an immutable audit trail.

---

## Current Build State

> This section reflects the **live verified state** as of the last commit. All three pipeline stages have been confirmed with real terminal output.

### Verified Pipeline ✅

| Stage | Command | Result |
|---|---|---|
| **Lint** | `npm run lint` | ✅ 127 files · 0 errors · Biome + tsgo + ast-grep |
| **Tests** | `npm run test` | ✅ 18 test files · **382 / 382 passing** · 0 failures · ~26 s |
| **Build** | `npm run build` | ✅ `dist/` created · 2467 modules · 2.3 s · index.html + JS + CSS |
| **Verify** | `npm run verify` | ✅ lint → test → build all exit 0 |

```
# Terminal evidence — npm run verify
Checked 127 files in 1919ms. No fixes applied.         ← lint

Test Files  18 passed (18)                             ← tests
     Tests  382 passed (382)
  Duration  26.40s

dist/index.html                     2.96 kB            ← build
dist/assets/index-DlyCKhKK.css     75.12 kB
dist/assets/index-B76kAsh9.js   1,512.57 kB
✓ built in 2.29s
```

### Verified Working ✅

| Component | Status | Evidence |
|---|---|---|
| **Lint pipeline** | ✅ Verified | `npm run lint` — 127 files, 0 errors (Biome + `tsgo` + ast-grep) |
| **Test suite** | ✅ Verified | `npm run test` — 382/382 passing across 18 files, 0 failures |
| **Production build** | ✅ Verified | `npm run build` → `dist/` with 1.5 MB JS + 75 KB CSS, Vite exit 0 |
| **2D Blueprint Editor** | ✅ Built | `BlueprintCanvas.tsx` (21 KB) — grid, wall drawing, door/window placement, snap-to-grid, undo/redo, export/import JSON, sample project load |
| **3D Viewport** | ✅ Built | `Viewport3D.tsx` (9 KB) — React Three Fiber Canvas, wall extrusion, opening markers, orbit controls, solar lighting. **WebGL error boundary** prevents crash on context failure |
| **ToolRail** | ✅ Built + Tested | `ToolRail.tsx` (5 KB) — 5 tools (Select/Wall/Door/Window/Measure), keyboard shortcuts, active state glow, touch-optimized. All 27 ToolRail tests pass. |
| **Properties Panel** | ✅ Built | `PropertiesPanel.tsx` (8 KB) — wall height/thickness/material, opening sill height, live measurements |
| **Solar Timeline** | ✅ Built | `SolarTimeline.tsx` (4 KB) — sun azimuth/elevation sliders, intensity control |
| **Material Picker** | ✅ Built | `MaterialPicker.tsx` (2 KB) — paint, wood, concrete presets |
| **Keyboard Shortcuts** | ✅ Built | `KeyboardShortcuts.tsx` (4 KB) — shortcut reference dialog |
| **App Layout** | ✅ Built | `AppLayout.tsx` — responsive sidebar (desktop) + Sheet drawer (mobile), grouped nav sections, active indicators |
| **All 15 Routes** | ✅ Built | Public marketing + private editor/governance routes — see Application Routes |
| **Extended ToolRail** | ✅ Built | Room, Vastu, MEP, Furniture, Landscape tools wired to canvas + 3D |
| **OAuth Sign-in** | ✅ Built | Google/Apple via Firebase or Supabase when backend configured |
| **Collaboration bar** | ✅ Built | Supabase Realtime presence when connected; local session fallback |
| **Spec Center** | ✅ Built | `SpecCenterPage.tsx` (10 KB) — locked spec cards, SHA-256 hash display, stats row |
| **Registry** | ✅ Built | `RegistryPage.tsx` (12 KB) — entry cards with type icons, grid layout, improved empty state with "view all" action |
| **Change Requests** | ✅ Built | `ChangeRequestsPage.tsx` (15 KB) — priority badges, status workflow, tab counts, improved empty states with CTAs |
| **Releases** | ✅ Built | `ReleasesPage.tsx` — live verification health banner (lint/test/build status), gate progress, stop-ship list, build status hero |
| **Audit Log** | ✅ Built | `AuditLogPage.tsx` (8 KB) — timeline layout, date grouping, action badges, empty state with editor CTA |
| **Core Modules** | ✅ Built | 12 modules — canvas engine, governance lock, version control, export/import, format validator, theme manager, accessibility layer, collaboration engine, element lock, multi-user governance |
| **Design System** | ✅ Built | `index.css` (288 lines) — dark/light mode tokens, glass panels, glow effects, elevation system, semantic colours |
| **Supabase Layer** | ✅ Built | `src/db/api.ts` — CRUD wrappers for all tables |
| **Onboarding** | ✅ Built | First-run panel on empty editor canvas with sample project CTA and new project CTA |
| **Save Mode Badge** | ✅ Built | Supabase / Local mode pill shown in editor toolbar |
| **2D→3D Sync Indicator** | ✅ Built | Pulse indicator in editor toolbar fires when walls/openings change |

### Known Limitations ⚠️

| Area | Status | Notes |
|---|---|---|
| **Supabase persistence** | ⚠️ Config-dependent | Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. App works in local-only mode without them — save/load is unavailable but all editing features function. |
| **Real-time collaboration** | ⚠️ Stubbed | `collaborationEngine.ts` and `multiUserGovernance.ts` exist and are unit-tested, but depend on Supabase Realtime which requires a live connection. |
| **Bundle size** | ⚠️ Large | 1.5 MB JS chunk — Three.js and React Three Fiber are the main contributors. Code-splitting is a future optimisation. |

### File Inventory

```
127  TypeScript / TSX source files
  1  Global CSS file (index.css)
 18  Test files (18 passed / 382 tests passing)
  7  Editor components
  7  Page components (6 routes + NotFound)
 12  Core modules
  1  Supabase API layer
  1  Route manifest
```

---

## Core Features

### Blueprint Editor
- Interactive 2D canvas with snap-to-grid and configurable grid size
- **Tools**: Select · Wall · Door · Window · Measure (keyboard shortcuts: V / W / D / N / M)
- Wall properties: length, height, thickness, material
- Door and window openings with sill height control
- Undo / redo with full history stack
- Save and load projects via Supabase persistence
- Export project as JSON · Import from JSON file
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
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
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
│   ├── db/
│   │   └── api.ts                      # Supabase CRUD layer
│   ├── modules/                        # Core business modules
│   ├── governance/                     # Governance lock + validation
│   ├── hooks/                          # Custom React hooks
│   ├── types/                          # TypeScript type definitions
│   ├── routes.tsx                      # Centralised route manifest
│   ├── App.tsx                         # Root app + router
│   └── index.css                       # Design tokens + global styles
├── supabase/
│   └── migrations/                     # Database schema migrations
├── docs/                               # Extended documentation
│   ├── SPEC.md                         # Blueprint editor specification (locked)
│   ├── GOVERNANCE_QUICKSTART.md        # Governance system guide
│   ├── RELEASE_v1.0.0.md               # v1.0.0 release notes
│   ├── REGISTRY.md                     # Registry documentation
│   └── prd.md                          # Product requirements document
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
# Firebase auth (primary)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Supabase data backend (projects, registry, releases, audit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional local dev bypass (development only)
# VITE_ALLOW_LOCAL_DEMO=true
```

Firebase handles sign-in. Supabase handles persistence. Without Firebase, sign-in is disabled. Without Supabase, the app runs in local-only demo mode for data features.

---

## Supabase Backend

Vishvakarma.OS uses Supabase for all persistent storage:

| Table | Purpose |
|---|---|
| `projects` | Blueprint project metadata |
| `specs` | Locked governance specifications |
| `registry_entries` | Component and feature registry |
| `change_requests` | Change request workflow records |
| `releases` | Release version records |
| `audit_logs` | Immutable system event log |

All schema is managed via migrations in `supabase/migrations/`.

---

## Scripts & Quality

```bash
npm run dev          # Vite dev server on 127.0.0.1
npm run build        # Production build → dist/
npm run preview      # Serve dist/ locally on :4173
npm run test         # Vitest run — 382 tests across 18 files
npm run test:coverage  # Vitest with v8 coverage report
npm run lint         # tsgo + Biome + ast-grep
npm run verify       # lint && test && build (full pipeline)
```

```
# Latest npm run verify output:
Checked 127 files in 1919ms. No fixes applied.   ← lint ✅

Test Files  18 passed (18)                        ← tests ✅
     Tests  382 passed (382)

dist/index.html                     2.96 kB       ← build ✅
dist/assets/index-DlyCKhKK.css     75.12 kB
dist/assets/index-B76kAsh9.js   1,512.57 kB
✓ built in 2.29s
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

Before inviting users to [https://vishvakarma-os.vercel.app](https://vishvakarma-os.vercel.app), configure **Production** environment variables in the Vercel project:

| Variable | Value |
|----------|-------|
| `VITE_BACKEND_PROVIDER` | `supabase` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

Optional Firebase auth variables and operator steps (migrations, RLS, smoke tests) are documented in [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md).

Validate locally:

```bash
pnpm run production:verify-env
```

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
| [`docs/prd.md`](docs/prd.md) | Full product requirements document |
| [`docs/GOVERNANCE_QUICKSTART.md`](docs/GOVERNANCE_QUICKSTART.md) | Governance system quick-start guide |
| [`docs/GOVERNANCE_IMPLEMENTATION.md`](docs/GOVERNANCE_IMPLEMENTATION.md) | Governance architecture deep-dive |
| [`docs/RELEASE_v1.0.0.md`](docs/RELEASE_v1.0.0.md) | v1.0.0 release notes and evidence pack |
| [`docs/release/VERCEL_ENV.md`](docs/release/VERCEL_ENV.md) | Vercel production environment variables |
| [`docs/REGISTRY.md`](docs/REGISTRY.md) | Registry documentation |
| [`docs/RELEASE.md`](docs/RELEASE.md) | Release process documentation |
| [`tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md`](tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md) | Complete build document |

---

## Changelog — Recent Updates

### Current (latest commit)

**Verification restored — full pipeline now proven:**
- **`npm run verify` exits 0** — lint → 382/382 tests → production build all pass in one command
- **`package.json` scripts restored** — `dev`, `build`, `preview`, `test`, `test:coverage`, `verify` all wired with real commands (removed echo/warning placeholders)
- **All 382 tests passing** — fixed 12 failing ToolRail tests (aria-label format and separator query mismatch from UI upgrade); 18/18 test files now green
- **Production build confirmed** — `dist/` with 2467 modules, 1.5 MB JS, 75 KB CSS, 2.3 s build time
- **First-run onboarding panel** — shown on empty editor canvas with step-by-step guide, "Load Sample Project" CTA, and "Create New Project" CTA
- **Save mode badge** — Supabase Connected / Local Mode pill shown in editor toolbar
- **2D→3D sync indicator** — pulse + spin icon fires in toolbar whenever walls or openings change
- **Live verification health banner** — top of ReleasesPage shows lint / test / build status with real pass counts from the verified pipeline run
- **Improved empty states** — Registry, Change Requests, and Audit Log all have action buttons (create, view all, navigate to editor)
- **Fixed hardcoded colours** — ReleasesPage `bg-green-600`, `bg-red-600`, `bg-amber-500` replaced with semantic tokens (`text-success`, `text-destructive`, `text-warning`)

### Previous

- **WebGL error boundary** — two-layer defence (pre-flight check + React class boundary) prevents app crash on `BindToCurrentSequence` or any other WebGL context failure; full 2D editor remains operational
- **UI upgrade** — premium dark glass architectural command center design system across all pages and components
- **AppLayout** — refactored sidebar with grouped navigation sections (Editor / Governance / System), active state indicators, governance status footer
- **ToolRail** — labeled tool sections (Tools / View), semantic token class names, keyboard shortcut `<kbd>` chips in tooltips, `aria-pressed` on all toggle buttons
- **EditorPage** — compact top toolbar, 2D Blueprint / 3D Preview pane header labels, "Model Chamber" subtitle in 3D pane, proper `overflow-hidden` layout
- **SpecCenterPage** — featured governing spec card with SHA-256 hash block, required sections grid, stats row (Total / Locked / Approved / Draft)
- **ChangeRequestsPage** — priority badges with icons (critical / high / medium / low), status counts on tab triggers
- **RegistryPage** — type-specific icon badges (Component · Feature · Tool), grid card layout with `h-full flex flex-col`
- **ReleasesPage** — build status hero card with gate progress bar, stop-ship violation list
- **AuditLogPage** — date-grouped timeline layout with vertical connector line, entity-coloured icon dots, event action badges
- **CSS design tokens** — `--cyan`, `--shadow-sm/md/lg`, `--shadow-glow`, `.glass-panel`, `.glow-ring`, `.gradient-text`, `.status-dot`, `.card-elevated` utilities added to `index.css`

---

## Learn More

Miaoda help documentation: [Download and Building the App](https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en)
