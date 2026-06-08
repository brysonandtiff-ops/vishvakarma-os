# Next Steps & Roadmap
## Vishvakarma.OS v1.1.0 → v2.0.0

**Current Status**: v1.1.0 feature polish complete locally; production requires Firebase env + evidence gate sign-off  
**Build**: GREEN locally — Vitest + Playwright + 13-gate manifest  
**Last Updated**: 2026-06-08

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
- [ ] Cross-browser manual smoke (Chrome, Safari, Firefox)

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

### v1.2.0 (Minor) — In progress
- [x] Custom materials, furniture UX, multi-project
- [ ] Lighting fixtures in 3D (MEP fixture manifest wired; 3D lights pending)
- [ ] Texture upload to Firebase Storage

### v2.0.0 (Major) — Scaffolded
- [ ] Multi-story (`manifest.floors[]`, `wall.floorIndex`) — types + `docs/v2/ARCHITECTURE.md`
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
- [ ] WCAG 2.1 AA audit (axe-playwright)

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
- [ ] Video tutorials

### Developer ✅
- [x] Architecture (`docs/README.md`, `docs/v2/ARCHITECTURE.md`)
- [x] CONTRIBUTING.md, DEPLOYMENT.md
- [ ] Standalone API reference doc

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
