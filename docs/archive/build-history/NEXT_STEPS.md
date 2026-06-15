> **Historical snapshot.** Point-in-time verification record from early 2026 development. For current architecture, routes, and commands see [README.md](README.md), [docs/SOFTWARE_INVENTORY.md](docs/SOFTWARE_INVENTORY.md), and [docs/CURRENT_PRODUCTION_ARCHITECTURE.md](docs/CURRENT_PRODUCTION_ARCHITECTURE.md).
# Next Steps & Roadmap
## Vishvakarma.OS v1.1.0 → v2.0.0

**Current Status**: v1.2.0 UI polish + public readiness audit complete locally; push to main for fresh CI artifact  
**Build**: GREEN locally — Vitest + Playwright + 13-gate manifest  
**Last Updated**: 2026-06-09

> **Gate numbering**: Authoritative system is **13 gates** in `src/governance/gates/gate-manifest.json`. Legacy `docs/RELEASE.md` 10-gate numbers are deprecated.

---

## Recently Completed

### v1.1.0 UX Polish ✅
- [x] Drag-to-reposition openings — handles, % overlay, single undo commit on pointer up
- [x] Room labeling — double-click edit, properties panel font/color, room centroid labels
- [x] Persistent dimensions — leader lines, Shift+D visibility toggle, PDF/SVG embed
- [x] Visual PDF export — rasterized floor plan with title block (A4/Letter)

### v1.2.0 Features ✅ (MVP)
- [x] Custom material library — dialog + `manifest.materials[]`
- [x] Furniture UX — F shortcut, drag reposition, picker panel
- [x] Multi-project management — search, archive, duplicate on Projects page
- [x] Area calculation — shown in label properties when room detected

### Foundation ✅
- [x] CHANGELOG.md, MIGRATION.md, SECURITY.md
- [x] Firebase-only documentation reconciled
- [x] Automated save/load + 2D/3D parity tests
- [x] API retry, logger, monitoring scaffold, analytics opt-in

---

## Priority 1: Testing & Quality Assurance

### 1.1 Manual Testing (Gates 9–12)
- [x] **Gate 9 — Save/Load determinism** — `src/test/saveLoadDeterminism.test.ts` + E2E
- [x] **Gate 10 — 2D/3D parity** — `src/test/parity2d3d.test.ts` + sample proof
- [x] **Gate 11 — iPad touch audit** — Playwright tablet viewports
- [x] **Gate 12 — Performance** — stressTest benchmarks + evidence doc
- [ ] Physical iPad Air 2020 session (operator)
- [x] Cross-browser automated smoke (Firefox + WebKit via Playwright)
- [ ] Cross-browser manual supplement (operator — see `docs/release/OPERATOR_CHECKLIST.md`)

### 1.2 Automated Tests (Gate 7–8)
- [x] Vitest suite
- [x] Playwright E2E auth + app smoke

---

## Release Planning

### v1.0.1 (Patch) ✅
- [x] Loading states on save
- [x] Improved error messages
- [x] Error boundary on blueprint canvas
- [x] Grid layer cache for canvas performance

### v1.1.0 (Minor) ✅
- [x] UX polish (openings, labels, dimensions)
- [x] Visual PDF export
- [x] Evidence gates 9–12 automated proof

### v1.2.0 (Minor) ✅
- [x] Custom materials, furniture UX, multi-project
- [x] Lighting fixtures in 3D — MEP tool cycles fixtures; Viewport3D point/spot/ceiling lights
- [x] Texture upload to Firebase Storage — CustomMaterialDialog + `storageUpload.ts`
- [x] Export fidelity — shared `floorPlanSvg.ts`; PNG/PDF include openings, labels, dimensions
- [x] Editor polish — status bar dimension toggle, export dialog, save badges, governance CTAs
- [x] Multi-floor scaffold — `FloorSwitcher`, `floorHelpers`, per-floor canvas filtering
- [x] Cross-browser E2E smoke (Firefox + WebKit)
- [x] WCAG accessibility audit (axe-playwright)
- [x] Operator checklist, video tutorial scripts, expanded API reference

### v2.0.0 (Major) — Scaffolded
- [x] Multi-story scaffold (`manifest.floors[]`, `wall.floorIndex`, `FloorSwitcher`) — full 3D stacking in v2
- [ ] Terrain modeling
- [ ] Real-time collaboration at scale
- [ ] DXF/DWG export extension
- [ ] BIM / IFC integration
- [ ] Mobile app (Capacitor)

---

## Technical Debt

### High Priority ✅
- [x] Error boundaries (App + BlueprintCanvas)
- [x] Loading states (Editor save, Projects page)
- [x] API retry (`fetchWithRetry`)
- [x] Offscreen/grid cache for canvas
- [x] Virtual scrolling — scrollable project list with max-height

### Medium Priority
- [ ] Refactor BlueprintCanvas into input/renderer/overlays
- [x] Structured logging (`src/lib/logger.ts`)
- [x] Analytics scaffold (`src/lib/analytics.ts`)
- [ ] TypeScript full strict mode

### Low Priority
- [ ] Vite 5.x migration
- [ ] Storybook for editor components
- [x] WCAG 2.1 AA audit scaffold (axe-playwright — `pnpm run test:e2e:a11y`)

---

## Deployment Checklist

### Pre-Deployment
- [x] Automated gates 1–8, 13
- [x] Manual evidence templates (gates 9–12)
- [ ] Operator: physical iPad + cross-browser proof

### Deployment
- [x] Vercel production documented (`docs/release/DEPLOYMENT.md`)
- [ ] Operator: Firebase prod env + Firestore rules deploy
- [x] Monitoring scaffold (Sentry DSN hook)
- [x] Analytics opt-in banner pattern

### Post-Deployment
- [ ] Operator: monitor error rates, collect feedback
- [ ] Video tutorials (script outlines in `docs/user/`)

---

## Documentation

### User ✅
- [x] Getting Started, Tool Reference, FAQ
- [x] Keyboard shortcuts (`docs/user/KEYBOARD_SHORTCUTS.md`)
- [x] Video tutorial script outlines (`docs/user/VIDEO_TUTORIAL_SCRIPTS.md`)
- [ ] Video tutorials (recorded)

### Developer ✅
- [x] Architecture (`docs/README.md`, `docs/v2/ARCHITECTURE.md`)
- [x] CONTRIBUTING.md, DEPLOYMENT.md
- [x] Standalone API reference doc (`docs/developer/API.md`)

### Governance ✅
- [x] SPEC, REGISTRY, RELEASE, CHANGELOG, MIGRATION, SECURITY

### Backlog RFCs ✅
- [x] `docs/rfc/` triage index + sample RFCs

---

## Feature Backlog

See `docs/rfc/README.md` for community requests and innovation ideas (curved walls, stairs, AI suggestions, AR/VR, etc.).

---

**Next Review**: 2026-06-15  
**Status**: v1.1.0 code complete — operator sign-off for production launch
