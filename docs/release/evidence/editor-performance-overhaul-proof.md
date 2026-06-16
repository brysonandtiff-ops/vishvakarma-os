# Editor Performance Overhaul — Proof Matrix

Generated at: 2026-06-16T04:13:00.384Z
Commit: `42ca85d53b85949fcfa125385f22f7e44c488e23`

## Summary

| Pass | Fail | Warn | Total |
|------|------|------|-------|
| 27 | 0 | 0 | 27 |

## Mock metrics

| Metric | Value |
|--------|-------|
| Spatial index (300 lookups) | 3.40 ms |
| Linear scan (300 lookups) | 4.23 ms |
| Canvas rAF coalesced | yes |

## Checklist

| Phase | ID | Check | Status | Detail |
|-------|-----|-------|--------|--------|
| 0 | p0-engine-notify | Viewport pan skips geometry listeners | **PASS** | geometryRevision=0, viewportRevision=1 |
| 0 | p0-compliance-pan | Geometry manifest excludes camera pan/zoom | **PASS** | camera omitted from getGeometryManifest() |
| 0 | p0-undo-coalesce | Undo coalesces continuous wall drag | **PASS** | single undo restores pre-drag wall |
| 1 | p1-canvas-raf | Canvas rAF scheduler coalesces draws | **PASS** | 3 requestDraw → 1 flush |
| 1 | p1-spatial-index | Spatial index hit-test parity + mock benchmark | **PASS** | indexed=3.40ms linear=4.23ms parity=w200 |
| 1 | p1-overlay-cache | Vastu analysis memoized by geometry hash | **PASS** | same object reference |
| 2 | p2-3d-demand | Bloom pipeline gated by wall count | **PASS** | cap=250 |
| 2 | p2-wall-batch | Wall batch helper thresholds | **PASS** | >=10 walls, non-cinematic |
| 4 | p4-background | Incremental cost invalidation helper | **PASS** | walls touch cost, name does not |
| 4 | p4-background | Room face cache memoizes floor graph | **PASS** | same array reference |
| 6 | p6-product-ci | Performance profile → atmosphere mapping | **PASS** | draft=standard, presentation=cinematic |
| 0 | p0-mouse-collab | Collab cursor broadcast throttled (~80ms) | **PASS** | — |
| 0 | p0-mouse-collab-radial | Radial menu uses dedicated tracker (not stage setMousePos) | **PASS** | — |
| 0 | p0-compliance-editor | EditorPage keys compliance on geometryRevision | **PASS** | — |
| 1 | p1-blueprint-raf | BlueprintCanvas uses canvas render scheduler | **PASS** | — |
| 4 | p4-draft-worker | Draft autosave scheduled via worker helper | **PASS** | — |
| 4 | p4-crdt-batch | CRDT remote updates batched at animation frame | **PASS** | — |
| 2 | p2-3d-frameloop | Viewport3D uses demand render loop (always during walk) | **PASS** | — |
| 2 | p2-3d-room-fps | Room meshes use cached faces, tier LOD, and batching | **PASS** | — |
| 2 | p2-3d-profile-atmosphere | Performance profile syncs 3D atmosphere in Viewport3D | **PASS** | — |
| 2 | p2-3d-walk-postfx | Walk mode disables cinematic post-FX pipeline | **PASS** | — |
| 2 | p2-3d-deferred | EditorPage defers 3D geometry props | **PASS** | — |
| 3 | p3-lazy-routes | Non-editor routes lazy-loaded | **PASS** | — |
| 5 | p5-deferred-governance | Production governance deferred via requestIdleCallback | **PASS** | — |
| 6 | p6-perf-hud | Dev performance HUD wired in editor | **PASS** | — |
| 6 | p6-perf-profile-ui | Performance profile panel in editor more panel | **PASS** | — |
| 6 | p6-docs | Performance notes and troubleshooting docs present | **PASS** | — |

## Run

```bash
pnpm run test:perf-overhaul
```

