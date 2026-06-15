# RFC 007 — Production Collaboration

## Status

**Proposed** — preview scaffold only (`src/collaboration/`); not production-ready.

## Problem

Enterprise tier lists real-time co-editing. Current Yjs/WebSocket preview lacks production auth, conflict resolution UX, RLS-backed project roles, and operational relay hosting.

## Proposal

1. **Relay service** — authenticated WebSocket room per project; Supabase JWT validation
2. **CRDT document** — Yjs state keyed to manifest slices (walls, openings, rooms)
3. **Presence** — cursor/selection broadcast (read-only phase first)
4. **Permissions** — owner/editor/viewer from `ProjectCollaborator` RLS
5. **Snapshot persistence** — periodic manifest snapshots to `collabSnapshot`

## Phases

| Phase | Scope |
|-------|-------|
| P0 | Read-only presence + manifest subscribe |
| P1 | Wall/opening co-edit with undo isolation |
| P2 | Full manifest CRDT + export gate |

## Non-goals

- Offline CRDT merge without server (Horizon 3)
- AutoCAD-style locking layers

## Risks

- WebSocket ops burden on Vercel — may require dedicated relay (Fly.io, Supabase Realtime evaluation)

## References

- [handoff/05-collaboration-preview.md](../handoff/05-collaboration-preview.md)
- `src/collaboration/`
