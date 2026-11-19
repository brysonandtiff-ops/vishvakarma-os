# Performance Notes

## Studio candidate checks — 19 November 2026

The local production build measured 3.94 MB of JavaScript and CSS. The 159-entry PWA precache measured 11.26 MB. Both repository budgets passed. Desktop Chromium rendered the Blueprint and 3D views and exercised Walk. Phone emulation verified touch drawing and movement. Hosted interaction timing and physical-device performance evidence are still required for gate 12. [Current release decision](../CURRENT_RELEASE_STATUS.md)

## Editor performance overhaul (2026-06)

Hot-path fixes shipped across the blueprint editor:

| Area | Change |
|---|---|
| Viewport pan/zoom | `setCanvasViewport()` notifies viewport listeners only — compliance and undo no longer run on pan |
| Compliance | Keyed on `geometryRevision` via `getGeometryManifest()` (camera excluded) |
| Undo | `beginEditTransaction()` / `commitEditTransaction()` coalesce drag snapshots |
| 2D canvas | rAF dirty scheduler + spatial index for hit-tests |
| 3D | `frameloop="demand"` (always during walk), atmosphere tiers wired to performance profile, batched walls (10+), batched room floors (5+), room tier LOD, bloom single-pass |
| Background | Worker draft save, incremental cost invalidation, cached room faces, batched CRDT remote apply |
| Profiles | Draft / Studio / Presentation in Properties → More panel |

## Dev HUD

- Query: `?perf=1`
- Storage: `localStorage.setItem('vishvakarma.os.perf.hud', '1')`

## Verification

| Check | Command |
|---|---|
| Types | `pnpm run lint:types` |
| Unit | `pnpm run test` |
| **Overhaul mock audit** | `pnpm run test:perf-overhaul` |
| E2E perf | `pnpm run test:e2e:perf` |
| Bundle | `pnpm run perf:gates` |

Proof matrix: [`editor-performance-overhaul-proof.md`](editor-performance-overhaul-proof.md)

## Targets (SPEC)

- 2D frame budget: **16ms** (iPad Safari PWA)
- 3D geometry sync: **200ms** after edit commit

## Runtime Interaction Checks

- Viewport pan/zoom does not trigger compliance recompute or undo snapshots (geometry revision unchanged).
- Wall drag edits coalesce into a single undo step via edit transactions.
- 2D canvas draw requests coalesce through the rAF scheduler; spatial index used for hit-tests at scale.
- 3D viewport uses demand rendering (continuous only in walk mode); performance profile drives atmosphere tier; room floors batch at 5+ rooms with tier-gated labels/ceilings; bloom and wall batching gated by profile and wall count.
- Draft autosave runs off the main thread; cost and room-face caches skip session-only edits.
- Manual iPad Safari PWA interaction and measured frame times still require device evidence before strict launch sign-off.
