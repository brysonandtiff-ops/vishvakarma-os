# QA Evidence Mode QA

Purpose: verify the in-app proof checklist that helps testers run and record evidence for iPad, PWA, editor, voice tour, and guided demo flows.

## Expected behavior

- A floating **QA Evidence** button appears in the app.
- Opening the panel shows proof checks for:
  - iPad PWA refresh
  - Editor Demo/Grid
  - Guided Demo Session
  - Voice Tour
  - Auth contract
  - Fresh build smoke
- Each proof card has an action button, copy button, and mark passed/undo pass button.
- Passed state is local-only and persists in `localStorage`.
- No backend write is made.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Launch control | QA Evidence button appears without blocking Voice Tour | TBD |
| Panel open/close | Panel opens and closes cleanly | TBD |
| Copy steps | Copy button writes evidence steps or shows fallback toast | TBD |
| Mark passed | Passed state updates and survives reload | TBD |
| iPad/PWA action | Opens editor and shows checklist steps | TBD |
| Editor action | Opens editor for Demo/Grid proof | TBD |
| Guided demo action | Starts sample + grid + snap + 3D + tutorial + voice | TBD |
| Voice action | Opens voice tour and starts playback | TBD |
| Auth action | Opens /auth without changing auth copy | TBD |
| No backend drift | Supabase/schema remains untouched | TBD |

## Manual evidence to capture later

1. iPad PWA screenshot: QA Evidence panel open.
2. iPad PWA screenshot: Guided demo session started from QA panel.
3. Desktop screenshot: copied evidence steps or fallback toast.
4. Auth screenshot: official auth screen still intact.
