# ADR-003: Project Manifest as editor state source of truth

**Status:** Accepted  
**Date:** 2026-02-15  

## Context

The editor manages walls, openings, materials, lighting, terrain, and governance-linked metadata. Multiple representations (canvas state, 3D scene graph, export formats) must stay synchronized.

## Decision

All editor state serializes to a single **Project Manifest** JSON document stored in Supabase `projects.manifest` (JSONB). The 2D canvas and 3D viewport derive from this manifest — they do not maintain independent authoritative geometry.

Schema: [project-manifest-schema.md](../project-manifest-schema.md)

## Consequences

- Positive: Deterministic save/load, export/import, and audit trail
- Positive: Optimization and compliance modules operate on one data shape
- Negative: Manifest schema changes require coordinated updates (types, validation, export, tests)
- Neutral: Collaboration preview (Yjs) targets manifest CRDT sync

## References

- [developer/DATA_MODEL.md](../developer/DATA_MODEL.md)
- `src/core/manifestSchema.ts`
