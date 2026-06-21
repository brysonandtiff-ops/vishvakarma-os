# No-Drift Tooling UI Polish Checklist

Purpose: improve how Vishvakarma.OS feels without drifting product identity, auth contracts, iPad fixes, PWA behavior, or data flows.

## Non-negotiable no-drift rules

| Rule | Expected result | Result |
|---|---|---|
| Official logo stays intact | No replacement of `OFFICIAL_LOGO_SRC` or swan mark | TBD |
| Auth contract stays safe | Google SSO accessible label remains test-safe | TBD |
| iPad editor stays usable | Demo and Grid quick actions remain visible | TBD |
| PWA update stays enabled | Installed iPad PWA receives new Vercel deployments | TBD |
| No backend/schema drift | No Supabase directory or data model changes | TBD |
| No route drift | Existing route names and navigation remain stable | TBD |

## Tooling UI acceptance

| Area | Must remain polished | Result |
|---|---|---|
| Tool rail | Section labels readable, active tool obvious, 44px+ touch targets | TBD |
| Top toolbar | Demo/Grid/3D/Project actions discoverable and horizontally scrollable on iPad | TBD |
| Menus | Menu items have readable hover/focus states and do not overflow viewport | TBD |
| Canvas empty state | Empty board explains the next action and has a touch-safe tour/demo path | TBD |
| Status surfaces | HUD/status/minimap/floating controls remain legible above canvas | TBD |
| Reduced motion | Animations are disabled when reduced motion is requested | TBD |

## Evidence to capture

1. iPad landscape: `/editor` with Demo and Grid actions visible.
2. iPad portrait: toolbar scroll behavior and tool rail reachability.
3. Desktop: top toolbar, tool rail, Project actions menu, and empty canvas state.
4. `/auth`: confirm official logo and Google SSO test-safe wording remain intact.
5. PWA: confirm installed app refreshes after deployment.
