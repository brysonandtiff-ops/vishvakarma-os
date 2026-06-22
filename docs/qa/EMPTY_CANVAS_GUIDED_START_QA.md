# Empty Canvas Guided Start QA

Purpose: verify a blank editor gives obvious next actions instead of feeling empty.

## Expected behavior

- When `/editor` has no meaningful content, a guided start card appears.
- The card offers:
  - Start demo
  - Draw wall
  - Voice tour
  - Dismiss
- When the design has walls/openings/rooms/furniture/MEP/landscape content, the card disappears.
- Dismiss only hides the card for the current React session.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Empty editor | Guided start card appears | TBD |
| Start demo | Starts guided demo session | TBD |
| Draw wall | Sets Draft mode, grid on, snap on, Wall tool active, Essentials overlay started | TBD |
| Voice tour | Opens Voice Tour and starts browser voice | TBD |
| Dismiss | Card hides without changing project data | TBD |
| Content loaded | Card disappears after sample/project content is present | TBD |
| No drift | Auth, Supabase, routes, and PWA behavior remain unchanged | TBD |

## Manual evidence to capture later

1. Empty `/editor` screenshot with the guided start card.
2. Tap Draw wall and confirm Wall tool + grid/snap + overlay.
3. Tap Start demo and confirm sample + 3D + voice tour.
4. Load sample/project and confirm the card disappears.
