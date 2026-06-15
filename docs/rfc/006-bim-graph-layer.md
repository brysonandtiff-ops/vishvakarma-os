# RFC 006 — BIM Graph Layer

## Status

**Accepted (v0 scaffold)** — typed building element graph adapter from ProjectManifest; full editor integration deferred.

## Problem

`ProjectManifest` is the SSOT for persistence but is a flat document. Schedules, clash detection, IFC export, and multi-discipline workflows need a **typed element graph** with stable IDs and relationships.

## Proposal

Introduce `src/domain/buildingGraph/`:

- `BuildingGraph` — nodes (walls, openings, rooms, floors, stairs, fixtures) + edges (hosted-by, bounds, connects)
- `manifestToBuildingGraph(manifest)` — read-only adapter; no manifest mutation
- Version `0.1` schema; bump when curved walls or MEP graph lands

## Non-goals (v0)

- Replacing ProjectManifest as persistence format
- Real-time graph sync in collaboration
- IFC serialization

## Success criteria

- Unit tests: node counts match manifest element counts
- Gate 15 (see [WORLD_CLASS_PLAN](../roadmap/WORLD_CLASS_PLAN.md)) passes when wired

## References

- [ADR-003 — ProjectManifest SSOT](../adr/003-project-manifest-source-of-truth.md)
- `src/domain/buildingGraph/`
