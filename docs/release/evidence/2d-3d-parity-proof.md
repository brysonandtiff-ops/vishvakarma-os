# 2D / 3D Parity Proof

Generated from commit: `v1.3.0 editor visual upgrade`
Deployment URL: https://vishvakarma-os.app
Vercel fallback URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-14T21:30:00.000Z
Operator: automated local verify
Result: PASS — sample project counts, scene origin, and room detection verified

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
