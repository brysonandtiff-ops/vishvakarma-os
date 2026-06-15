# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current target version | v1.5.0 |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-06-14 |
| Final status | **v1.4 editor upgrade** — unit tests green locally |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS | Local `pnpm run lint:types`, `pnpm run test`, `pnpm run build` |
| 2D/3D parity | Polygon room volumes + dynamic origin | PASS | [`2d-3d-parity-proof.md`](2d-3d-parity-proof.md) |
| iPad layout | Touch targets + zoom/pan smoke | PASS | [`e2e/ipad-editor-layout.spec.ts`](../../e2e/ipad-editor-layout.spec.ts) |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Cloud save/load | Save project → reload → identical manifest | PASS | [`save-load-proof.md`](save-load-proof.md) — unit + E2E determinism tests |

## Manual Device Evidence

| Device | Route / flow | Status | Operator | Notes |
|---|---|---|---|---|
| Desktop Chrome | Save/load determinism | PASS | Automated | `saveLoadDeterminism.test.ts` |
| Desktop Chrome | 2D/3D parity | PASS | Automated | `parity2d3d.test.ts` |
| iPad / tablet | Touch target audit | PASS | Playwright coarse-pointer | `ipad-editor-layout.spec.ts` |
| iPad / tablet | Canvas zoom readout | PASS | Playwright | Wheel zoom status bar smoke |

## v1.4 Feature Evidence

| Feature | Proof |
|---|---|
| Polygon 3D room floors | `sceneRoomMeshes.tsx` + `getVerticesForRoom` |
| Editor layer toggles | `EditorLayerPanel` + `session.layerVisibility` |
| Full floor scoping | `floorIndex` on manifest layers + hook filters |
| Presentation mode | Hides tool rail/properties; widens 3D pane |
| DXF scale slider | `ImportFloorPlanDialog` + `scaleManifestGeometry` |
| iPad walk mode | Touch pad + `TouchWalkRig` in `Viewport3D` |
| AI → editor handoff | `manifestTransformer` roomType/floorIndex |

## v1.5 Feature Evidence

| Feature | Proof |
|---|---|
| Orthogonal wall draw + endpoint drag | `wallDrawConstraints.ts`, `BlueprintCanvas` + `PropertiesPanel` metric length |
| 2D room-type fills | `roomTypeColors.ts`, `drawRooms.ts` |
| Stacked 3D floors | `Viewport3D` `BuildingSceneLayers` + `showAllFloorsIn3D` session |
| Cinematic bloom | `CinematicBloom` + `@react-three/postprocessing` |
| DXF LWPOLYLINE | `dxfImport.ts` + fixture test |
| NBC rule depth | `nbc-stair-rise-run`, `access-ramp-gradient`, `fire-dead-end-corridor` |
| Collab preview | `05-collaboration-preview.md`, `EditorCollaborationBar` label |

## Stop-Ship Review

- [x] v1.5 editor CAD polish implemented on `main`
- [x] Typecheck + unit tests green
- [x] Evidence ledger synced to v1.5.0
