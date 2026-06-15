# Akasha Cast v1 — Semantic Lens Broadcasting

**Status:** Implemented (decision-support)  
**Runtime source:** `src/cast/`, `src/pages/CastViewerPage.tsx`, `api/cast/*`  
**UI:** `AkashaCastPanel`, `/cast/:token` viewer route

## Purpose

Akasha Cast lets architects **broadcast living building intelligence** — manifest deltas, camera intent, simulation lenses, and design-decision narrative — instead of pixel screen sharing. Viewers render crisp 2D/3D locally on any device via a magic link.

## Disclaimer

Akasha Cast is **not** certified council review, legal approval, or guaranteed compliance. Simulation lenses and intent relay are heuristic decision-support only. Cast evidence exports are audit aids, not regulatory submissions.

## Channels

| Channel | Payload | Viewer behavior |
|---------|---------|-----------------|
| Manifest | Yjs CRDT manifest deltas | Live blueprint + 3D update |
| Lens | Presenter toggles (thermal, Vayu, Vastu, MEP, compliance, layers) | Local simulation overlay |
| Chrono | `LightingConfig` + chrono lock | Synchronized solar study |

## Roles

| Role | Default view | Annotations |
|------|--------------|-------------|
| `viewer` / `family` | 3D + follow camera | Room pins (Enterprise) |
| `council_reviewer` | 2D emphasis + compliance lens | Element pins (Enterprise) |
| Presenter (host) | Full editor | N/A |

## Tier gating

| Capability | Tier |
|------------|------|
| Start cast, 3 viewers, manifest + camera | Studio |
| Simulation lenses + chrono sync | Studio |
| Role invites, pins, evidence export | Enterprise |

## Integration points

- Collab relay: `server/collab/` with cast token auth
- Presentation lock: auto-enabled when cast starts
- Governance: Cast Evidence Roll JSON export (`cast_events`)

## Non-goals (v1)

- Pixel video streaming or OBS integration
- Co-editing during cast (viewers read-only)
- Offline replay without export
