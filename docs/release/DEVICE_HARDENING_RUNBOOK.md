# Device Hardening Runbook (Manual)

Use this checklist on a **physical iPad** after automated Playwright gates pass in CI. Automated coverage is documented in [evidence/device-hardening-audit.md](./evidence/device-hardening-audit.md).

## Prerequisites

1. Deploy production preview (or use staging URL).
2. Configure cloud env if testing autosave/sync badge.
3. Have Safari on iPad and optional Apple Pencil.

## PWA Home Screen install

1. Open the deployed site in Safari on iPad.
2. Share → **Add to Home Screen**.
3. Confirm app name is **Vishvakarma.OS**.
4. Launch from Home Screen — verify **standalone** mode (no Safari chrome).
5. Capture screenshot: `docs/release/evidence/ipad_homescreen.png`.

## Auth + keyboard (portrait and landscape)

1. Open `/auth` from Home Screen app.
2. Portrait: confirm safe-area padding and no clipped controls.
3. Tap email field — confirm keyboard does not permanently hide submit button.
4. Repeat in landscape.
5. Screenshots already in evidence: `ipad-auth-portrait.png`, `ipad-auth-landscape.png`.

## Editor touch workflow

1. Sign in and open `/editor`.
2. Verify tool rail buttons are easy to tap (44px feel).
3. Use **Pan** tool — one-finger canvas pan.
4. Pinch zoom on blueprint canvas.
5. Toggle 3D panel — no horizontal overflow in portrait.
6. Optional: draw walls with Apple Pencil; verify palm rejection.
7. Flip Apple Pencil (eraser end) on a wall and opening — confirm geometry is removed.

## Autosave / sync badge

1. With Supabase configured, save a project.
2. Confirm sync/autosave indicator visible in editor chrome.
3. Capture screenshot or note timestamp in this file.

## Performance (optional before strict launch)

1. Open a sample project with 10+ walls.
2. Record Safari Web Inspector frame timing during pan/zoom.
3. Target: **16ms** average frame budget for 2D canvas (see [performance-notes.md](./evidence/performance-notes.md)).

## Sign-off

| Step | Date | Operator | Evidence file |
|------|------|----------|---------------|
| Home Screen install | | | `ipad_homescreen.png` |
| Pencil draw pass | | | |
| Pencil eraser delete | | | |
| Frame timing | | | |
| Autosave badge | | | |

## Related

- [IPAD_PRODUCTION_READINESS.md](./IPAD_PRODUCTION_READINESS.md)
- [evidence/ipad-touch-audit.md](./evidence/ipad-touch-audit.md)
