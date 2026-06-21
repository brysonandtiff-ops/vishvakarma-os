# Auth and iPad 10 Smoke Checklist

**Product:** Vishvakarma.OS  
**Scope:** Auth page, iPad 10 usability, first workspace navigation, and iPad King editor feel  
**Status:** Manual evidence template

Use this checklist after every auth-theme or iPad usability PR before calling the build user-ready.

---

## Devices and viewports

| Check | Target | Result |
|---|---|---|
| Desktop wide auth | 1440px or wider | TBD |
| Small laptop auth | 981px to 1215px | TBD |
| iPad 10 landscape | 1180 x 820 class | TBD |
| iPad 10 portrait | 820 x 1180 class | TBD |
| Mobile portrait | 390px to 430px wide | TBD |

---

## Auth visual checks

| Check | Expected | Result |
|---|---|---|
| Reference look | Blue/gold divine architect stage, glass card, mandala, blueprint lines | TBD |
| Sign-in card visible | No right-side clipping at tablet widths | TBD |
| Vertical scroll | Page scrolls when content exceeds viewport | TBD |
| Touch targets | Primary, magic link, Google, forgot password, request access are usable | TBD |
| Safe areas | No controls under browser chrome or iOS safe area | TBD |
| Reduced motion | Core auth content remains readable when motion is reduced | TBD |

---

## Auth behavior checks

| Check | Expected | Result |
|---|---|---|
| Empty email submit | Shows email-required feedback | TBD |
| Email access link | Shows success or configured send result | TBD |
| Forgot password | Shows reset-unavailable guidance and points to magic link or Google sign-in | TBD |
| Google sign-in | Starts Google OAuth or shows embedded-browser recovery | TBD |
| Copy recovery URL | Copies or displays auth URL when OAuth is blocked | TBD |
| Local workspace dev mode | Appears only when local unconfigured mode allows it | TBD |

---

## Editor entry checks

| Check | Expected | Result |
|---|---|---|
| Post-auth route | Lands in Blueprint Editor or stored destination | TBD |
| Command palette | `Ctrl+K` / `Cmd+K` opens route and Learn search | TBD |
| Tutorial hub | Tutorial hub opens and lists tracks | TBD |
| First tutorial highlight | Essentials highlights visible controls or falls back cleanly | TBD |
| iPad editor controls | Grid, 3D, undo/redo, export, status actions respond to taps | TBD |
| 3D viewport | Toggle and orbit remain usable on iPad landscape | TBD |

---

## iPad King editor checks

| Check | Expected | Result |
|---|---|---|
| Tool rail feel | Tool buttons are easy to hit, horizontally scroll with momentum, and do not fight the canvas | TBD |
| Top-bar reachability | Header actions stay reachable without clipping in landscape and portrait | TBD |
| Status-bar reachability | Status actions scroll smoothly and keep 48px-class hit targets | TBD |
| Canvas gesture priority | Canvas keeps drawing/orbit/pan gestures without page rubber-band interference | TBD |
| Panel scroll | Properties, side panels, dialogs, and sheets scroll internally with safe-area clearance | TBD |
| iOS form behavior | Form inputs do not trigger unwanted zoom on focus | TBD |
| Focus visibility | Keyboard or hardware-keyboard focus ring is obvious on touch controls | TBD |
| Reduced motion | iPad polish remains usable with reduced motion enabled | TBD |

---

## Evidence capture

Attach these when running a release candidate:

- Desktop wide auth screenshot.
- Small laptop auth screenshot.
- iPad 10 landscape auth screenshot.
- iPad 10 portrait auth screenshot.
- Mobile portrait auth screenshot.
- Short recording of auth to editor to command palette to tutorial hub.
- Short recording of iPad editor tool rail, canvas gesture, 3D toggle, properties panel, and status-bar actions.

Store evidence under `docs/release/evidence/` when it is part of a release proof package.

---

## Sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Product check | TBD | TBD | TBD |
| iPad check | TBD | TBD | TBD |
| Release check | TBD | TBD | TBD |
