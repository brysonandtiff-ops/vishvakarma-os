# v2.0 Architecture (Scaffolding)

> **Forward-looking:** This document describes planned or preview features. For current production, see [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md).

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  

---

## Multi-story buildings

- `BuildingFloor` entries in `manifest.floors[]`
- `wall.floorIndex` scopes geometry per level
- Floor switcher UI in editor toolbar (`FloorSwitcher.tsx` — scaffolded in v1.2.0)
- Per-floor 2D canvas filtering via `floorHelpers.ts` (3D vertical stacking planned)

## Terrain modeling

- `TerrainPatch` with contour points and elevation
- Landscape workspace extrusion in `Viewport3D`

## Real-time collaboration

- Yjs CRDT on `ProjectManifest` via `src/collaboration/crdt/manifestBridge.ts`
- `CollabSession` + Supabase-authenticated `server/collab/presenceServer.ts` (y-websocket relay)
- Awareness-driven presence (cursor, viewport, focused entity) in editor overlay
- Supabase-backed collaboration metadata; optional local fallback when `VITE_COLLAB_WS_URL` is unset
- `collaborationEngine.ts` facade preserves local-only fallback when WebSocket URL is unset

**Status:** Preview scaffold only. See [handoff/05-collaboration-preview.md](../handoff/05-collaboration-preview.md).

## Industry exports

- DXF extended in `dxfExport.ts`
- DWG via server-side ODA conversion (RFC)
- IFC subset export (RFC)

## Mobile

- PWA shell with iPad safe-area hardening (shipped in v1.x)
- Touch-target CSS and radial menu (shipped)
