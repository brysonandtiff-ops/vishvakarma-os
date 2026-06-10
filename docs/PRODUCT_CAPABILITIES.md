# Vishvakarma.OS — Product Capabilities

**Version:** v1.2 (codebase `APP_VERSION` v1.1.1) · **Last audited:** 2026-06-08

Authoritative capability brief aligned with the codebase. Use this for README, marketing, and launch copy.

---

## 1. 2D Blueprint Editor (`src/components/editor/`)

### Drawing and interaction

The 2D canvas is fully interactive and uses pointer events for mouse, touch, and Apple Pencil — an iPad-first workflow.

### Architectural tools

The ToolRail includes functional tools for selecting, drawing walls, and placing doors and windows. Users can add editable text labels, persistent dimension leader lines, furniture, MEP symbols, landscape elements, and (in MEP mode) lighting fixtures.

| Tool | Shortcut | Notes |
|------|----------|-------|
| Select | V | Inspect, drag openings and furniture |
| Wall | W | Tap start, tap end |
| Door / Window | D / N | Snap to walls |
| Label | T | Double-click to edit text |
| Dimension | ⇧M | Leader lines; toggle all with ⇧D or status bar |
| Furniture | F | Drag reposition |
| MEP | — | Cycles outlet, switch, HVAC, panel, then point/spot/ceiling fixtures |

### Precision drafting

- Snap-to-grid and endpoint snap for corner auto-joining
- **Gold** corner-join ring (`#CF9B3A`) when wall endpoints snap during preview — not green
- Openings drag along walls with percentage-based parametric positioning and undo-safe commit on pointer up

### Spatial calculations

Room perimeters, enclosed-space detection, and area use the **Shoelace formula** in [`src/utils/roomCalculations.ts`](../src/utils/roomCalculations.ts). Area appears in the label properties panel when a room is detected.

### Undo / redo

Up to **50** manifest versions via [`floorPlanEngine.ts`](../src/core/floorPlanEngine.ts) (`maxVersions: 50`).

### v1.2 additions

- MEP lighting fixtures (point, spot, ceiling) — 2D placement + 3D lights
- Dimension visibility chip in status bar
- Custom materials with optional Firebase Storage texture upload

---

## 2. Live 3D Viewport (`src/components/editor/Viewport3D.tsx`)

### Real-time rendering

React Three Fiber and Three.js translate the 2D manifest into 3D geometry. Walls extrude; openings render as semi-transparent **red doors** (`#C85A54`) and **gold windows** (`#D4A13D`) — not blue.

### Environment controls

`SolarTimeline` adjusts sun azimuth and elevation. Atmosphere modes: standard, premium, cinematic.

### Material system

Presets (paint, wood, concrete) plus custom materials via `CustomMaterialDialog`. Optional `textureUrl` maps onto walls with `useTexture` from drei.

### Lighting fixtures

`FixtureLight` renders point and spot lights from manifest `fixtures[]` placed via the MEP tool.

### Resilience

WebGL pre-flight check plus `WebGLErrorBoundary` — the 2D editor remains usable if 3D fails.

---

## 3. Governance Operating System (`src/governance/`)

### Spec and registry

- **Spec Center** — locked specifications with SHA-256 hash verification
- **Registry** — schema for components and project properties

### Change and release management

Structured change-request pipeline. **Releases** enforces a **13-gate** release manifest (automated tests, 2D/3D parity, touch targets, performance evidence, etc.) as a stop-ship barrier.

**World record metric:** gates **1–12** count toward the compliance claim; **gate 13** verifies the measurement artifact exists. See [`docs/world-record/WORLD_RECORD_CLAIM.md`](world-record/WORLD_RECORD_CLAIM.md).

### Audit logging

`AuditLogPage` — immutable chronological timeline of governance actions.

### World Records

`WorldRecordsPage` tracks the self-verified gate-count claim with reproducible `pnpm run record:measure` evidence.

---

## 4. Infrastructure and data persistence

### Firebase

Firebase Auth (passwordless email link; Google/Apple when enabled) and Firestore for projects, profiles, and governance data when `VITE_FIREBASE_*` env vars are set.

### Local draft fallback

Without Firebase, **Local Workspace** mode saves manifests to `localStorage` with draft recovery on next visit.

### Export pipeline

**Export Package** dialog (user-facing): **JSON**, **PNG**, **PDF** (recommended), **DXF**, **SVG**.

| Format | Content |
|--------|---------|
| JSON | Full `ProjectManifest` round-trip |
| PNG | Rasterized plan — walls, openings, labels, dimensions |
| PDF | Visual floor plan + title block (A4/Letter) |
| DXF | Basic LINE entities |
| SVG | Vector floor plan via `buildFloorPlanSvg` / `ExportModule.exportSVG` |

PNG and PDF rasterize from the shared SVG builder in [`src/core/exporters/floorPlanSvg.ts`](../src/core/exporters/floorPlanSvg.ts).

### Pricing

Public `/pricing` route when `VITE_PRICING_PAGE_ENABLED=true` (default in `.env.example`).

---

## 5. Design system and quality assurance

### Workstation aesthetic

Gold workstation / dark glass design system — semantic Tailwind CSS variables (`--primary`, `--ws-*`), frosted editor chrome, cream drafting-board canvas.

### iPad-first compliance

Responsive side-sheet navigation; **44×44 px** minimum touch targets (`touch-target` class).

### Test coverage

Vitest unit/integration suite + Playwright E2E (auth gates, app smoke, page-reference pack). Run `pnpm run test` for current count.

Quality enforcement: Biome, TypeScript (`tsgo`), ast-grep structural rules.

---

## Accuracy notes (audit corrections)

| Common misstatement | Correct wording |
|---------------------|-----------------|
| Green snap indicators | Gold corner-join ring |
| Blue window boxes in 3D | Gold windows |
| 12 gates only | 12 metric gates; 13 total pipeline |
| Export as SVG only via API | SVG also in Export Package dialog |
| Stale test count | **457** Vitest tests (47 files) as of 2026-06-08 — re-run `pnpm run test` before publishing |

---

## 6. Architecture Copilot (v2.0)

Autonomous building design from site inputs:

- **Upload**: site survey, boundary plan (DXF/PDF/image), council requirements, design brief
- **Generate**: concept design, floor plan, 3D manifest, schedules, material list, cost estimate
- **Compliance**: automated NCC stub audit (12 rules) with export gate
- **Export**: compliance report PDF and permit package ZIP (8 documents + manifest.json)

Entry: Editor menu → **Architecture Copilot** · New Project → **Start with Architecture Copilot**

Spec: [`docs/specs/ARCHITECTURE_COPILOT_v2.md`](specs/ARCHITECTURE_COPILOT_v2.md)

---

## 7. Design Optimization Engine (Phase 3)

Multi-candidate design optimization and decision engine:

- **Generate**: 5 strategy-driven candidates (Family Focused, Budget Optimized, Energy Optimized, Premium Lifestyle, Maximum Resale Value)
- **Score**: 8 explainable categories (0–100) plus weighted overall score — compliance, cost, natural light, energy, circulation, privacy, resale, buildability
- **Site fitness**: solar orientation, slope, setbacks, open-space quality
- **Budget intelligence**: iterative cost reduction when target budget is set
- **Battle view**: `/optimization` — card comparison, score breakdown, tradeoffs, favorites
- **Export**: optimization report PDF with winner, runner-up, and risk areas

Entry: Sidebar → **Design Optimization** · Copilot review step → **Compare 5 designs**

Spec: [`docs/specs/DESIGN_OPTIMIZATION_ENGINE.md`](specs/DESIGN_OPTIMIZATION_ENGINE.md)

---

## Related docs

- [README.md](../README.md) — build state and routes
- [NEXT_STEPS.md](../NEXT_STEPS.md) — roadmap
- [EXPORT_LIMITATIONS.md](user/EXPORT_LIMITATIONS.md) — format limits
- [PAGE_REFERENCE.md](design/page-references/PAGE_REFERENCE.md) — UI screenshots
