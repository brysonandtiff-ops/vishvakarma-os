# Vishvakarma.OS

**An iPad-first, browser-native architectural blueprint editor and live 3D studio — with a strict governance operating system built in.**

[![Lint](https://img.shields.io/badge/lint-clean%20·%20127%20files-brightgreen)]()
[![Files](https://img.shields.io/badge/files-126%20TS%2FTSX%20%2B%2018%20tests-informational)]()
[![Stack](https://img.shields.io/badge/stack-React%2018%20·%20Three.js%20·%20Supabase-informational)]()
[![WebGL](https://img.shields.io/badge/WebGL-error%20bounded-brightgreen)]()
[![UI](https://img.shields.io/badge/UI-premium%20dark%20glass-blueviolet)]()

---

## What is Vishvakarma.OS?

Vishvakarma.OS is a browser-native architectural design tool that combines a **2D blueprint canvas** with a **live 3D model chamber**, wrapped in a governance operating system that enforces spec compliance, change control, audit logging, and release gating.

It is designed as a professional architectural OS — not just a drawing app. Every modification flows through a governed change-request pipeline. Every release is blocked unless all gates pass. Every system action is logged in an immutable audit trail.

---

## Current Build State

> This section reflects the **live repository state** as of the last commit. It separates verified working components from documented but unverified features.

### Verified Working ✅

| Component | Status | Evidence |
|---|---|---|
| **Lint pipeline** | ✅ Clean | `npm run lint` — 127 files, 0 errors (Biome + `tsgo` + ast-grep) |
| **2D Blueprint Editor** | ✅ Built | `BlueprintCanvas.tsx` (21 KB) — grid, wall drawing, door/window placement, snap-to-grid, undo/redo, export/import JSON, sample project load |
| **3D Viewport** | ✅ Built | `Viewport3D.tsx` (9 KB) — React Three Fiber Canvas, wall extrusion, opening markers, orbit controls, solar lighting. **WebGL error boundary** prevents crash on context failure |
| **ToolRail** | ✅ Built | `ToolRail.tsx` (5 KB) — 5 tools (Select/Wall/Door/Window/Measure), keyboard shortcuts, active state glow, touch-optimized |
| **Properties Panel** | ✅ Built | `PropertiesPanel.tsx` (8 KB) — wall height/thickness/material, opening sill height, live measurements |
| **Solar Timeline** | ✅ Built | `SolarTimeline.tsx` (4 KB) — sun azimuth/elevation sliders, intensity control |
| **Material Picker** | ✅ Built | `MaterialPicker.tsx` (2 KB) — paint, wood, concrete presets |
| **Keyboard Shortcuts** | ✅ Built | `KeyboardShortcuts.tsx` (4 KB) — shortcut reference dialog |
| **App Layout** | ✅ Built | `AppLayout.tsx` — responsive sidebar (desktop) + Sheet drawer (mobile), grouped nav sections, active indicators |
| **All 6 Routes** | ✅ Built | `/`, `/spec-center`, `/registry`, `/change-requests`, `/releases`, `/audit` — all pages render without error |
| **Spec Center** | ✅ Built | `SpecCenterPage.tsx` (10 KB) — locked spec cards, SHA-256 hash display, stats row |
| **Registry** | ✅ Built | `RegistryPage.tsx` (12 KB) — entry cards with type icons, grid layout, empty state |
| **Change Requests** | ✅ Built | `ChangeRequestsPage.tsx` (15 KB) — priority badges, status workflow, tab counts |
| **Releases** | ✅ Built | `ReleasesPage.tsx` (14 KB) — gate progress, stop-ship list, build status hero |
| **Audit Log** | ✅ Built | `AuditLogPage.tsx` (8 KB) — timeline layout, date grouping, action badges |
| **Core Modules** | ✅ Built | 12 modules — canvas engine, governance lock, version control, export/import, format validator, theme manager, accessibility layer, collaboration engine, element lock, multi-user governance |
| **Design System** | ✅ Built | `index.css` (288 lines) — dark/light mode tokens, glass panels, glow effects, elevation system, semantic colours |
| **Supabase Layer** | ✅ Built | `src/db/api.ts` — CRUD wrappers for all tables |

### Known Limitations ⚠️

| Area | Status | Notes |
|---|---|---|
| **Dev / Build scripts** | ⚠️ Disabled | `npm run dev` and `npm run build` print warnings. Use `npx vite --host 127.0.0.1` to start. This is an intentional lint-only workflow. |
| **Tests** | ⚠️ Not runnable | 18 test files exist but `npm test` is not wired in `package.json`. Vitest config is present. Tests are **unverified**. |
| **Supabase persistence** | ⚠️ Config-dependent | Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. App works in local-only mode without them. |
| **Real-time collaboration** | ⚠️ Stubbed | `collaborationEngine.ts` and `multiUserGovernance.ts` exist but rely on Supabase Realtime which is untested. |
| **Production build** | ⚠️ Not confirmed | No recent production build has been verified. Vite config exists but build script is disabled. |

### File Inventory

```
126  TypeScript / TSX source files
  1  Global CSS file (index.css)
 18  Test files (unverified)
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
| `/` | Blueprint Editor | Main 2D + 3D workspace |
| `/spec-center` | Spec Center | Locked governing specifications |
| `/registry` | Registry Center | Component and feature inventory |
| `/change-requests` | Change Requests | Governed change workflow |
| `/releases` | Release Center | Gate-checked release pipeline |
| `/audit` | Audit Log | Full system event timeline |

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

- **Node.js** ≥ 20
- **npm** ≥ 10 or **pnpm** ≥ 9

### Setup

```bash
# 1. Install dependencies
npm install
# or
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start the development server
npx vite --host 127.0.0.1

# 4. Run the linter (TypeScript + Biome + ast-grep)
npm run lint
```

> **Note:** The `npm run dev` and `npm run build` scripts are intentionally disabled in this workspace — the project uses a lint-only verification workflow. To start the dev server directly, use `npx vite`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are required for project save/load, change requests, registry, releases, and audit log. The app functions in a degraded (local-only) mode without them.

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

## Lint & Quality

```bash
npm run lint
# Runs: tsgo (TypeScript native) + Biome (correctness) + ast-grep (structural rules)
# Expected result: 127 files · 0 errors
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
| [`docs/REGISTRY.md`](docs/REGISTRY.md) | Registry documentation |
| [`docs/RELEASE.md`](docs/RELEASE.md) | Release process documentation |
| [`tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md`](tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md) | Complete build document |

---

## Changelog — Recent Updates

### Current (latest commit)

- **WebGL error boundary** — two-layer defence (pre-flight check + React class boundary) prevents app crash on `BindToCurrentSequence` or any other WebGL context failure; full 2D editor remains operational
- **UI upgrade** — premium dark glass architectural command center design system across all pages and components
- **AppLayout** — refactored sidebar with grouped navigation sections (Editor / Governance / System), active state indicators, governance status footer
- **ToolRail** — labeled tool sections (Tools / View), semantic token class names, keyboard shortcut `<kbd>` chips in tooltips, `aria-pressed` on all toggle buttons
- **EditorPage** — compact top toolbar, 2D Blueprint / 3D Preview pane header labels, "Model Chamber" subtitle in 3D pane, proper `overflow-hidden` layout
- **SpecCenterPage** — featured governing spec card with SHA-256 hash block, required sections grid, stats row (Total / Locked / Approved / Draft)
- **ChangeRequestsPage** — priority badges with icons (critical / high / medium / low), status counts on tab triggers, improved empty state with inline CTA
- **RegistryPage** — type-specific icon badges (Component · Feature · Tool), grid card layout with `h-full flex flex-col`, improved empty state
- **ReleasesPage** — build status hero card with gate progress bar, stop-ship violation list, removed hardcoded `bg-green-*` / `bg-red-*` colour classes
- **AuditLogPage** — date-grouped timeline layout with vertical connector line, entity-coloured icon dots, event action badges
- **CSS design tokens** — `--cyan`, `--shadow-sm/md/lg`, `--shadow-glow`, `.glass-panel`, `.glow-ring`, `.gradient-text`, `.status-dot`, `.card-elevated` utilities added to `index.css`
- **Lint** — 0 errors across 127 files

---

## Learn More

Miaoda help documentation: [Download and Building the App](https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en)
