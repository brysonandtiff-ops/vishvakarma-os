# Release Polish Sign-off

**Product:** Vishvakarma.OS  
**Purpose:** End-to-end polish checklist before calling a build release-ready.  
**Status:** Partial sign-off — automated UI audit remediation shipped 2026-06-27 (operator chrome gated, auth simplified, `/3d-room` nav, E2E pricing fix)

Use this checklist after the auth, iPad, navigation, tutorial, and editor polish branches have been merged.

---

## Whole-product surface check

| Area | Pass condition | Result |
|---|---|---|
| Auth | Auth page loads, scrolls, and gives clear sign-in feedback on desktop, tablet, and phone | **PASS (automated)** — email-link primary flow; `device-auth-layout.spec.ts` |
| Home / marketing | Primary call-to-action, pricing, feature sections, and footer render without clipping | **PASS (automated)** — production route audit 2026-06-27; `marketing-pages.spec.ts` |
| Workspace shell | Sidebar, mobile navigation, command palette, and route transitions remain usable | **PASS (automated)** — `/3d-room` added to nav; `workspace-navigation.spec.ts` |
| Editor | Tool rail, canvas, 3D pane, properties panel, export, undo/redo, grid, and status controls respond | **PASS (automated)** — `editor-draw-workflow-proof.spec.ts`, device hardening audit |
| Tutorial hub | Hub opens, tracks are discoverable, and visible targets are highlighted correctly | TBD (manual recording) |
| Projects | New/open/duplicate/archive flows render without visual overlap | **PASS (automated)** — `projects-profile.spec.ts` |
| Optimization | Candidate generation surface is readable and clearly labelled as decision support | **PASS (automated)** — prototype notice + `optimization.spec.ts` |
| Governance | Spec Center, Change Requests, Releases, World Records, and Audit are navigable | **PASS (automated)** — unified `PageStateBlock` loading/error; `governance-smoke.spec.ts` |
| Profile/billing | Plan/account state is visible and no disabled billing state looks broken | **PASS (automated)** — `projects-profile.spec.ts` |
| Offline/PWA | Add-to-Home-Screen, safe areas, and recovery messaging are acceptable | **PARTIAL** — automated PWA gates pass; physical Home Screen install manual |

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
| Touch targets | Important touch controls meet 44px minimum, iPad editor targets aim for 48px class | **PASS (automated)** — `device-hardening-audit.md` |
| Focus rings | Keyboard focus is visible on buttons, links, tabs, inputs, and command palette items | TBD (manual keyboard pass) |
| Dialogs/sheets | No dialog opens behind another layer or clips outside safe areas | TBD (manual) |
| Scroll behavior | Nested panels scroll internally without trapping the user | TBD (manual) |
| Forms | Inputs are readable and do not zoom unexpectedly on iOS | **PASS (automated)** — auth email-only field ≥16px; `device-auth-layout.spec.ts` |
| Reduced motion | Product remains readable with reduced motion enabled | **PASS (automated)** — CSS guards in motion system |
| Error states | Auth and save failures show clear recovery copy | **PASS (automated)** — `PageStateBlock` on governance pages |
| Loading states | Skeletons/spinners do not block key navigation forever | **PASS (automated)** — unified governance loading states |

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
