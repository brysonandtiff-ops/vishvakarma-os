# Collaboration preview (v1.5)

Real-time multi-user editing is **not** production-ready in v1.5. The codebase includes a preview scaffold for local testing and future Enterprise rollout.

## What exists today

- **Yjs CRDT bridge** — [`src/collaboration/crdt/manifestBridge.ts`](../../src/collaboration/crdt/manifestBridge.ts) syncs manifest fragments.
- **WebSocket provider** — [`src/collaboration/sync/YjsWebSocketProvider.ts`](../../src/collaboration/sync/YjsWebSocketProvider.ts) connects to a collab server.
- **Collab session singleton** — [`src/collaboration/sync/CollabSession.ts`](../../src/collaboration/sync/CollabSession.ts) manages connect/disconnect and presence.
- **Remote cursors** — [`RemoteCursorsOverlay`](../../src/components/editor/collaboration/RemoteCursorsOverlay.tsx) on the editor canvas when presence is active.

## Local preview setup

1. Set `VITE_COLLAB_WS_URL` (optional). Default when unset:
   - Browser: `ws://<hostname>:1234` or `wss://` on HTTPS.
   - Node fallback: `ws://127.0.0.1:1234`
2. Run a Yjs websocket server on port **1234** (see `server/collab/` in this repo).
3. Open the editor — when connected, the header shows **Live sync (preview)**.

## Limitations (v1.5)

- No merge conflict UI or permission model.
- No guaranteed persistence across sessions (Supabase snapshot provider is experimental).
- Enterprise tier still lists full collaboration as **planned**.
- Do not use for production co-editing without a dedicated hardening pass.

## Related handoff

- Product surface: [`04-application-surface.md`](04-application-surface.md)
- Enterprise roadmap: marketing / billing tier docs
