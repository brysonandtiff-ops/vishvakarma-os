# Guided Demo Session QA

Purpose: verify the one-button demo flow for first-time testers on iPad, desktop, and installed PWA.

## Expected behavior

Starting the demo session should:

1. Navigate to `/editor` when started from another screen.
2. Load the Full Feature Showcase sample.
3. Turn the canvas grid on.
4. Turn snap on.
5. Open the live 3D panel.
6. Reset the canvas viewport.
7. Open the Essentials tutorial overlay.
8. Open the Voice Tour and start browser voice.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Editor top bar action | **Start demo** appears before Demo/Grid | TBD |
| Command palette action | **Start demo session** appears under Learn | TBD |
| Sample loads | Full Feature Showcase appears in editor | TBD |
| Grid on | Top bar shows Grid on and grid is visible | TBD |
| 3D open | 3D panel is visible after start | TBD |
| Voice tour opens | Voice tour panel opens and starts reading | TBD |
| Tutorial overlay opens | Essentials overlay appears | TBD |
| iPad PWA path | Installed PWA gets latest build and demo flow works | TBD |
| No auth drift | Auth copy and Google SSO contract unchanged | TBD |
| No backend drift | No Supabase/schema changes | TBD |

## Evidence to capture

1. iPad landscape: tap **Start demo**, capture sample + grid + 3D + voice tour.
2. iPad portrait: confirm toolbar scroll keeps **Start demo**, **Demo**, and **Grid on/off** reachable.
3. Desktop: use command palette and start the demo session from another route.
4. PWA: verify installed app receives the latest build before starting session.
