# Changelog

All notable changes to Vishvakarma.OS are documented in this file.

## [1.1.1] - 2026-06-08

### Added
- Visual PDF export with rasterized floor plan, labels, and dimensions
- Opening drag handles, position % overlay, and single-step undo on commit
- Label double-click edit, properties panel font/color controls
- Dimension leader lines and Shift+D visibility toggle
- Custom material dialog, furniture picker, F shortcut, furniture drag
- Projects page search, archive, and duplicate
- Save/load determinism and 2D/3D parity automated tests
- MIGRATION.md, SECURITY.md, CONTRIBUTING.md, DEPLOYMENT.md
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
