# v2.0 Architecture (Scaffolding)

## Multi-story buildings

- `BuildingFloor` entries in `manifest.floors[]`
- `wall.floorIndex` scopes geometry per level
- Floor switcher UI in editor toolbar (`FloorSwitcher.tsx` — scaffolded in v1.2.0)
- Per-floor 2D canvas filtering via `floorHelpers.ts` (3D vertical stacking planned)

## Terrain modeling

- `TerrainPatch` with contour points and elevation
- Landscape workspace extrusion in `Viewport3D`

## Real-time collaboration

- `collaborationEngine.ts` + Firebase Realtime DB or Liveblocks
- Manifest patch CRDT on `FloorPlanEngine.touchManifest`

## Industry exports

- DXF extended in `dxfExport.ts`
- DWG via server-side ODA conversion (RFC)
- IFC subset export (RFC)

## Mobile

- Capacitor wrapper targeting iPad-first web app
- Apple Pencil pressure via Capacitor plugin
