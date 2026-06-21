# Release Polish Sign-off

**Product:** Vishvakarma.OS  
**Purpose:** End-to-end polish checklist before calling a build release-ready.  
**Status:** Manual sign-off template

Use this checklist after the auth, iPad, navigation, tutorial, and editor polish branches have been merged.

---

## Whole-product surface check

| Area | Pass condition | Result |
|---|---|---|
| Auth | Auth page loads, scrolls, and gives clear sign-in feedback on desktop, tablet, and phone | TBD |
| Home / marketing | Primary call-to-action, pricing, feature sections, and footer render without clipping | TBD |
| Workspace shell | Sidebar, mobile navigation, command palette, and route transitions remain usable | TBD |
| Editor | Tool rail, canvas, 3D pane, properties panel, export, undo/redo, grid, and status controls respond | TBD |
| Tutorial hub | Hub opens, tracks are discoverable, and visible targets are highlighted correctly | TBD |
| Projects | New/open/duplicate/archive flows render without visual overlap | TBD |
| Optimization | Candidate generation surface is readable and clearly labelled as decision support | TBD |
| Governance | Spec Center, Change Requests, Releases, World Records, and Audit are navigable | TBD |
| Profile/billing | Plan/account state is visible and no disabled billing state looks broken | TBD |
| Offline/PWA | Add-to-Home-Screen, safe areas, and recovery messaging are acceptable | TBD |

---

## Device matrix

| Device / viewport | Required checks | Result |
|---|---|---|
| Desktop 1440+ | Auth, home, editor, governance, command palette | TBD |
| Small laptop 1024-1215 | Auth card, editor panels, tutorial popovers | TBD |
| iPad 10 landscape | Editor controls, tool rail, 3D, properties, dialogs | TBD |
| iPad 10 portrait | Stacked panels, tool rail, tutorial, navigation | TBD |
| Phone 390-430 | Auth, marketing, mobile nav, profile, command palette fallback | TBD |

---

## Interaction polish

| Check | Pass condition | Result |
|---|---|---|
| Touch targets | Important touch controls meet 44px minimum, iPad editor targets aim for 48px class | TBD |
| Focus rings | Keyboard focus is visible on buttons, links, tabs, inputs, and command palette items | TBD |
| Dialogs/sheets | No dialog opens behind another layer or clips outside safe areas | TBD |
| Scroll behavior | Nested panels scroll internally without trapping the user | TBD |
| Forms | Inputs are readable and do not zoom unexpectedly on iOS | TBD |
| Reduced motion | Product remains readable with reduced motion enabled | TBD |
| Error states | Auth and save failures show clear recovery copy | TBD |
| Loading states | Skeletons/spinners do not block key navigation forever | TBD |

---

## Evidence package

Attach these for a supervised release candidate:

- Auth screenshots: desktop, small laptop, iPad landscape, iPad portrait, phone.
- Editor recording: open editor, tap tool rail, draw/select, toggle grid, toggle 3D, open properties, use command palette.
- Tutorial recording: open Tutorial hub, start Essentials, confirm visible target behavior.
- Governance recording: route through Spec Center, Change Requests, Releases, Audit.
- PWA check: iPad safe areas and Add to Home Screen behavior.

Store release evidence under `docs/release/evidence/` when used for launch proof.

---

## Sign-off

| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Founder/product | TBD | TBD | TBD | TBD |
| iPad device QA | TBD | TBD | TBD | TBD |
| Release owner | TBD | TBD | TBD | TBD |
