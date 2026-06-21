# iPad Editor Grid + Demo QA

Purpose: verify first-time iPad testers can immediately see the grid and load a demo blueprint without hunting through overflow menus.

## Scope

- `/editor` on iPad landscape and portrait.
- Installed PWA and Safari tab after a fresh Vercel deployment.
- Top editor toolbar, canvas grid visibility, and sample/demo access.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Quick Demo button is visible | Top bar shows a readable **Demo** action without opening Project actions | TBD |
| Quick Grid button is visible | Top bar shows **Grid on** or **Grid off** with readable state | TBD |
| Grid defaults visible | Fresh editor session shows visible grid lines | TBD |
| Grid toggle works | Tapping Grid changes the state and canvas grid updates | TBD |
| Demo loads | Tapping Demo opens the sample picker / load sample path | TBD |
| Toolbar remains reachable | Top toolbar scrolls horizontally without clipping critical controls | TBD |
| PWA refresh keeps latest UI | Installed iPad app receives the newest toolbar after deployment | TBD |

## Notes

The quick buttons intentionally duplicate existing overflow/menu actions. That is deliberate for usability: iPad testers should not need to discover hidden menus before they can load a demo or confirm the grid is on.
