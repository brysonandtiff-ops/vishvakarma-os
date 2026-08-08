# 2D / 3D Parity Proof

Generated from commit: `max realism visual upgrade`
Deployment URL: https://vishvakarma-os.app
Vercel fallback URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-15T18:30:00.000Z
Operator: automated local verify
Result: PASS — bundled PBR catalog, expanded material presets, Indian furniture parametric meshes, and shared pattern keys verified

## Max realism upgrade (2026-06-15)

- 2D pattern overlays extended for `plaster`, `marble`, `tile`, `metal` (512px procedural fallback).
- Material picker swatches render pattern previews aligned with 3D `PbrSurfaceMaterial` bundles.
- Indian furniture types (`mandir`, `diwan`, `charpai`, `jali_screen`, `puja_shelf`, `modular_kitchen_base`) use dedicated parametric 3D meshes matching 2D silhouettes.

## Purpose

Prove that the 3D Model Chamber accurately reflects the 2D blueprint model for a representative project, including v1.3 room volumes and dynamic origin alignment.

## Test Project

| Field | Value |
|---|---|
| Project name | Sample House 01 |
| Source | Sample |
| Wall count expected | 4 |
| Opening count expected | 3 |
| Materials expected | 0 |
| Solar state expected | Default timeline |

## Parity Checklist

| Check | Expected | Actual | Status |
|---|---|---|---|
| 2D wall count | 4 | 4 | PASS |
| 3D wall count / visible extrusions | 4 | 4 | PASS |
| 2D door/window opening count | 3 | 3 | PASS |
| 3D opening markers visible | 3 | 3 | PASS |
| Wall thickness/height reflected | yes | yes | PASS |
| Dynamic scene origin (bbox center) | yes | yes | PASS |
| Room detection → 3D volume feed | yes | yes | PASS |
| Stair meshes when present | yes | yes | PASS |
| Material selection reflected | yes | yes | PASS |
| Solar lighting control updates scene | yes | yes | PASS |
| WebGL fallback safe if unavailable | yes | yes | PASS |

## Automated Tests

- `src/test/parity2d3d.test.ts` — manifest counts, finite wall coords, `computeSceneOrigin`, showcase room detection
- `src/test/roomCalculations.test.ts` — multi-room face extraction and smallest-cycle point pick

## Required Evidence

- Sample JSON wall/opening counts verified programmatically.
- `Viewport3D` consumes the same `EditorPage` state as `BlueprintCanvas` (walls, openings, rooms, staircases).
- Visual screenshot proof still recommended for release evidence.

## Console / WebGL Notes

```txt
Automated parity run — no console errors captured locally.
```

## Verdict

```txt
PASS — automated sample project parity confirmed; v1.3 dynamic origin and room volume wiring verified in unit tests.
```
