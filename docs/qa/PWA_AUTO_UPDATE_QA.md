# PWA Auto-Update QA

Purpose: make installed iPad and desktop PWA users receive the newest Vercel deployment without manually deleting the app or clearing Safari cache.

## Expected behavior

- The service worker checks for a new deployment on app start.
- The service worker checks again when the user focuses the app, comes back online, or every 60 seconds.
- A newly deployed service worker skips waiting and claims open clients.
- When the new worker takes control, the app reloads once so the latest UI is visible.

## iPad test script

1. Install Vishvakarma.OS to the iPad Home Screen.
2. Open the installed app and confirm the current build loads.
3. Deploy a new Vercel preview or production build.
4. Return to the installed app and wait up to 60 seconds, or background and reopen it.
5. Confirm the app refreshes to the new build without uninstalling.
6. Open `/editor` and confirm the newest UI is visible.
7. Confirm grid and demo/sample access are visible after refresh.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Installed iPad app refreshes after new deploy | Latest UI appears without deleting PWA | TBD |
| Safari tab refreshes after new deploy | Latest UI appears after focus/update check | TBD |
| Offline mode still opens cached shell | App shell opens when offline | TBD |
| Returning online triggers update check | Latest deploy is picked up | TBD |
| Editor opens after auto refresh | No blank screen or service worker loop | TBD |

## Notes

The app intentionally reloads once after a new service worker takes control. This is required so installed PWA users do not keep stale JavaScript/CSS from an older Vercel deployment.
