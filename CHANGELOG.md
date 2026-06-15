# Changelog

All notable changes to Vishvakarma.OS are documented in this file.

## [1.5.0] - 2026-06-14

### Added
- Orthogonal wall draw lock (Shift) and wall endpoint drag with live metric length in properties
- 2D room-type fill palette matching 3D room tints
- Stacked multi-floor 3D preview with ghost lower floors and “Stack floors” toggle
- Cinematic bloom via `@react-three/postprocessing` (desktop, gated, wall-count cap)
- DXF `LWPOLYLINE` import alongside LINE entities
- NBC stub rules: stair rise/run, ramp gradient, dead-end corridor
- Compliance panel category filter chips
- Collaboration preview handoff doc (`docs/handoff/05-collaboration-preview.md`)
- Blueprint canvas modularization (`blueprint/drawRooms`, `drawWalls`, `inputHandlers`)

### Changed
- `full-feature-showcase.json` includes second floor walls for stacked 3D demo
- Properties panel shows wall length in metric/imperial via `formatDimensionBySystem`
- Collaboration bar label: “Live sync (preview)” when connected

## [1.4.0] - 2026-06-14

### Added
- Polygon 3D room floors and Text labels from detected room vertices
- Editor canvas layer toggles (walls, rooms, furniture, MEP, Vastu, etc.)
- Canvas minimap with viewport rectangle and click-to-pan
- Presentation mode: hides tool rail and properties, enlarges 3D preview
- `floorIndex` on furniture, MEP, landscape, terrain, and staircases with full floor filtering
- DXF import scale slider in preview step
- iPad touch-walk mode with on-screen move pad; cinematic god-ray boost on desktop
- AI Designer handoff preserves `roomType` and `floorIndex` on rooms
- Compliance panel links findings to room names when `roomId` is present

### Changed
- Room volumes use true polygon geometry instead of centroid squares
- `refreshStoredRooms` runs after manifest load

## [1.3.0] - 2026-06-14

### Added
- Multi-room detection via planar face extraction (`findAllRoomFaces`, smallest-cycle `detectRoomAtPoint`)
- Canvas zoom/pan viewport with wheel zoom, shift/middle pan, status-bar zoom badge, and manifest camera persistence
- Room type picker and quick-type chips in the properties panel
- Blueprint loader v2: full manifest preservation in `normalizeManifest`, SVG round-trip export/import, DXF import with preview step
- Export layer toggles (rooms, furniture, dimensions) and full-fidelity SVG/PNG/PDF/DXF output
- 3D chamber upgrades: dynamic scene origin, room volume slabs, stair meshes, improved door/window geometry, walk mode (Pointer Lock), floor-scoped fixtures

### Changed
- Unified gold/cream visual tokens across editor chrome and secondary panels
- Canvas drawing polish: wall shadows, grid edge fade, stronger snap rings
- `Viewport3D` consumes floor-filtered rooms and staircases from `EditorPage`

### Fixed
- Room centroid uses polygon centroid instead of wall-endpoint average
- Import no longer strips manifest fields (`floors`, `terrain`, `fixtures`, `metadata`, etc.)

## [1.2.0] - 2026-06-09

### Added
- Multi-floor scaffold: `floorHelpers`, `FloorSwitcher` UI, per-floor wall filtering
- Cross-browser Playwright smoke (Firefox + WebKit) — `pnpm run test:e2e:cross-browser`
- WCAG accessibility audit — `pnpm run test:e2e:a11y` with `@axe-core/playwright`
- Expanded developer API reference (`docs/developer/API.md`)
- Video tutorial script outlines (`docs/user/VIDEO_TUTORIAL_SCRIPTS.md`)
- Operator launch checklist (`docs/release/OPERATOR_CHECKLIST.md`)

### Changed
- `package.json` version synced to `1.2.0` (display version in `src/config/appVersion.ts`)
- Playwright config: `cross-browser-firefox`, `cross-browser-webkit`, `accessibility-audit` projects

## [1.1.1] - 2026-06-08

### Added
- Visual PDF export with rasterized floor plan, labels, and dimensions
- Opening drag handles, position % overlay, and single-step undo on commit
- Label double-click edit, properties panel font/color controls
- Dimension leader lines and Shift+D visibility toggle
- Custom material dialog, furniture picker, F shortcut, furniture drag
- Projects page search, archive, and duplicate
- Save/load determinism and 2D/3D parity automated tests
- MIGRATION.md, SECURITY.md, CONTRIBUTING.md; deployment guide at `docs/release/DEPLOYMENT.md`
- API retry, structured logger, monitoring and analytics consent scaffold
- v2 architecture doc and RFC backlog index

### Changed
- Firebase-only documentation reconciled across README and launch docs
- NEXT_STEPS.md synced to 13-gate manifest and current implementation status

## [1.1.0] - 2026-05-29

### Added
- Firebase + Supabase production verification scripts (`production:verify-env`, `production:evidence`)
- PDF export for floor plans and Spec Center specifications
- SVG import for Vishvakarma-exported floor plans
- Room label tool (`T`) and persistent dimension annotations (`Shift+M`)
- Drag-to-reposition openings in select mode
- Supabase Realtime transport for collaboration engine
- Element lock integration for multi-user undo coordination
- SHA-256 governance snapshot hashing
- User docs: Getting Started, Tool Reference, FAQ
- Coverage thresholds in CI and `pnpm run ci`

### Changed
- Auth documentation aligned to Firebase-first architecture
- Release gate script validates Firebase and Supabase env templates
- CI workflows inject Firebase dummy vars for E2E builds
- Spec Center buttons wired (view, export PDF, create draft spec)

### Fixed
- Admin setup script checks update errors and uses admin createUser API
- Removed stale dependencies (`miaoda-auth-react`, duplicate plugin entries)

## [1.0.0] - 2026-02-15

### Added
- iPad-first 2D blueprint editor with live 3D chamber
- Governance OS routes and enforcement framework
- JSON/SVG export, JSON import, local draft recovery
- Playwright auth gate and Vitest suite
