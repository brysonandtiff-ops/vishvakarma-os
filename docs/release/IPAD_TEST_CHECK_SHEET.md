# Vishvakarma.OS — iPad Manual Test Check Sheet

**Purpose:** Practical QA checklist for testing Vishvakarma.OS on a **physical iPad** after all patches are merged and CI gates pass. Use this sheet to confirm the product works as a real iPad workstation — PWA install, touch controls, auth, editor, save/load, billing, and governance surfaces.

**When to use:** After deploy to production (or staging), when automated Playwright device tests are green, and before public launch or a major release sign-off.

**Related docs:** [DEVICE_HARDENING_RUNBOOK.md](./DEVICE_HARDENING_RUNBOOK.md) · [device-hardening-audit.md](./evidence/device-hardening-audit.md) · [IPAD_PRODUCTION_READINESS.md](./IPAD_PRODUCTION_READINESS.md)

---

## Prerequisites

| Item | Required |
|------|----------|
| Physical iPad (iPadOS 14+; iPad Pro 12.9" or similar recommended) | Yes |
| Safari (default browser for PWA install) | Yes |
| Stable Wi‑Fi | Yes |
| Test account (Google OAuth enabled) | Yes |
| Apple Pencil (2nd gen or compatible) | Optional — needed for pen-specific tests |
| Second device or desktop (for email magic-link tap) | Optional — for email-link auth |

---

## Environment

Fill in before testing:

| Field | Value |
|-------|-------|
| **Build / deploy** | e.g. production `2026-06-20`, Vercel preview URL |
| **Primary URL** | `https://vishvakarma-os.app` |
| **Fallback URL** | `https://vishvakarma-os.vercel.app` |
| **Local URL (optional)** | `http://127.0.0.1:5173` — only if testing a dev build on same network |
| **Test Google account** | `___________________________` |
| **Test email (magic link)** | `___________________________` |
| **iPad model / iOS version** | e.g. iPad Pro 12.9" / iPadOS 18.x |
| **Pencil model (if used)** | e.g. Apple Pencil 2 / N/A |
| **Tester name** | `___________________________` |
| **Test date** | `___________________________` |

**Legend for Result column:** `Pass` · `Fail` · `Partial` · `N/A`

Items marked **[PARTIAL]** are known gaps in launch evidence ([AGENTS.md](../../AGENTS.md)); passing here upgrades evidence — failing confirms the gap.

---

## How to use this sheet

1. Complete **Section A (PWA)** first — launch all later tests from the Home Screen app when possible.
2. Test **portrait and landscape** where noted (rotate iPad between passes).
3. Record **Pass / Fail / Partial / N/A** and short notes for every row.
4. Capture screenshots for failures; save to `docs/release/evidence/` when filing release proof.
5. Do not treat collaboration preview as production co-editing — scope is UI chrome only.

---

## A. PWA & Home Screen install

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Open primary URL in **Safari** (not Chrome) | | | | |
| - [ ] | Tap Share → **Add to Home Screen** | | | | |
| - [ ] | Confirm app name is **Vishvakarma.OS** | | | | |
| - [ ] | Launch from Home Screen — opens in **standalone** mode (no Safari address bar) | | Manual proof not automated — see runbook | | |
| - [ ] | App icon displays official Vishvakarma logo | | | | |
| - [ ] | Status bar uses translucent / safe-area layout (no content under notch) | | | | |
| - [ ] | Service worker registers (offline shell loads; auth/API still need network) | | | | |
| - [ ] | Screenshot captured: `docs/release/evidence/ipad_homescreen.png` | | | | |

---

## B. Orientation, safe areas & keyboard

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | **Portrait:** landing page — no horizontal scroll, readable hero | | | | |
| - [ ] | **Landscape:** landing page — layout intact | | | | |
| - [ ] | **Portrait:** `/auth` — controls not clipped by notch or home indicator | | | | |
| - [ ] | **Landscape:** `/auth` — controls not clipped | | | | |
| - [ ] | Tap email field on `/auth` — on-screen keyboard appears | | | | |
| - [ ] | With keyboard open, **Submit / Continue** button remains reachable (scroll or resize) | | | | |
| - [ ] | Dismiss keyboard — layout returns to normal | | | | |
| - [ ] | **Portrait:** `/editor` — tool rail and status bar respect safe areas | | | | |
| - [ ] | **Landscape:** `/editor` — no critical UI cut off | | | | |
| - [ ] | Rotate during editor session — canvas and panels recover without crash | | | | |

---

## C. Authentication

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Signed out: open `/editor` → redirects to `/auth` with return path | | | | |
| - [ ] | Signed out: open `/projects` → redirects to `/auth` | | | | |
| - [ ] | **Google OAuth:** tap **Continue with Google** → consent → lands on `/editor` or intended route | | Automated PASS on prod; confirm on device | | |
| - [ ] | After Google sign-in, **refresh page** — session persists | | | | |
| - [ ] | **Sign out** → returns to `/auth`; private routes blocked again | | | | |
| - [ ] | **Email magic link:** enter email → receive link → open on iPad → signed in | | Optional; OTP path not primary launch path | | |
| - [ ] | Cold start: open Home Screen app directly to `/editor` — session restores (brief boot screen OK) | | | | |

---

## D. Marketing & global navigation

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | `/` landing — hero, CTA buttons tappable (≥44px feel) | | | | |
| - [ ] | `/features` — scrolls smoothly, no overflow in portrait | | | | |
| - [ ] | `/pricing` — loads (if enabled); tier cards readable on iPad | | N/A if pricing flag off | | |
| - [ ] | Official logo visible on marketing and auth pages | | | | |
| - [ ] | App shell nav: reach **Projects**, **Editor**, **Profile** from signed-in menu | | | | |
| - [ ] | Unknown URL shows friendly not-found page (not blank screen) | | | | |

---

## E. Projects workspace

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | `/projects` — project list loads | | | | |
| - [ ] | Tap **New project** (or equivalent) — opens editor or create flow | | | | |
| - [ ] | Open existing project — editor loads with saved content | | | | |
| - [ ] | Project cards / rows — easy to tap; no mis-taps | | | | |
| - [ ] | Rename or delete project (if exposed) — works on touch | | N/A if not in UI | | |

---

## F. 2D Blueprint Editor — core workflow **[PARTIAL]**

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | `/editor` loads without crash | | | | |
| - [ ] | Load **sample blueprint** (e.g. Sample House / Indian category) | | | | |
| - [ ] | **Select** tool — tap wall or opening; selection highlights | | **[PARTIAL]** — full E2E workflow incomplete | | |
| - [ ] | **Wall** tool — tap start point, tap end point; wall appears | | **[PARTIAL]** | | |
| - [ ] | **Door / Window** tool — place opening on wall | | **[PARTIAL]** | | |
| - [ ] | Drag opening along wall — moves smoothly | | | | |
| - [ ] | **Properties panel** — shows wall/opening/room fields; edits apply | | **[PARTIAL]** | | |
| - [ ] | **Undo / Redo** — reverses last edit | | | | |
| - [ ] | **Measure / Dimension** tool — place dimension line | | | | |
| - [ ] | **Furniture** tool — place and drag item | | | | |
| - [ ] | **Room** tool — assign room type | | | | |
| - [ ] | Snap-to-grid / corner join ring visible when endpoints align | | | | |
| - [ ] | Status bar shows zoom level; reset view works | | | | |
| - [ ] | Minimap — tap to pan / navigate | | | | |

---

## G. Touch & coarse-pointer controls

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Tool rail buttons feel ≥44×44 px; no accidental adjacent taps | | Automated PASS; confirm feel on device | | |
| - [ ] | **Pan (Hand)** tool — one-finger drag pans canvas | | | | |
| - [ ] | **Pinch zoom** on blueprint canvas — zoom in/out smoothly | | | | |
| - [ ] | On-canvas **zoom +/-** buttons work | | | | |
| - [ ] | **Long-press** on canvas — radial tool menu appears (coarse pointer) | | | | |
| - [ ] | Top bar / sidebar actions — labels readable; buttons tappable | | | | |
| - [ ] | Dialogs (export, shortcuts, settings) — close button reachable | | | | |
| - [ ] | **Mantras** toggle in status bar — opens on touch; mode chips tappable | | | | |

---

## H. Apple Pencil (optional)

Skip section if no Pencil. Manual proof not automated.

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Pencil draws wall segments with precision (tap-tap or drag per tool mode) | | Manual — see runbook | | |
| - [ ] | Pencil hover shows snap preview before commit (if supported by iOS/Safari) | | Browser-dependent | | |
| - [ ] | **Palm rejection:** rest hand on screen while drawing — no stray touches | | | | |
| - [ ] | Switch between finger pan and Pencil draw without mode confusion | | | | |
| - [ ] | Eraser / select with Pencil (if exposed) works | | | | |

---

## I. 3D viewport & walk mode

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Toggle **3D panel** — 3D view appears; 2D still usable | | | | |
| - [ ] | **Portrait:** 3D stack ~42dvh — no horizontal overflow | | | | |
| - [ ] | **Landscape:** 3D panel expands; walls/openings visible in 3D | | | | |
| - [ ] | 2D wall/opening counts match 3D scene (sample project spot-check) | | | | |
| - [ ] | Orbit / touch rotate 3D camera (coarse pointer — no pointer-lock) | | | | |
| - [ ] | **Walk mode D-pad** — on-screen pad moves camera; targets ≥44px | | | | |
| - [ ] | **Cinematic** atmosphere tier hidden or unavailable on iPad (coarse pointer) | | Expected behavior | | |
| - [ ] | Solar timeline presets (Dawn, Noon, etc.) — tappable | | | | |
| - [ ] | Background app → return — if WebGL lost, **"Restoring 3D view…"** overlay or **Reload 3D view** appears; 2D editor still works | | | | |
| - [ ] | `/3d-room` route loads (if used) — touch navigation OK | | N/A if deprecated in UI | | |

---

## J. Save, load, export & import **[PARTIAL]**

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | **Save** project — success toast or indicator | | | | |
| - [ ] | **Autosave / sync badge** visible in editor chrome after cloud save | | Manual proof pending per runbook | | |
| - [ ] | **Hard refresh** Safari tab — project reloads from cloud with same wall/opening counts | | **[PARTIAL]** — needs live iPad operator proof | | |
| - [ ] | Close Home Screen app → reopen — project state recovered | | | | |
| - [ ] | **Export JSON** — file downloads / share sheet works | | Automated PASS; confirm on iPad | | |
| - [ ] | **Export PNG / PDF / SVG** — output opens or saves | | | | |
| - [ ] | **Import JSON** — re-import exported file; counts match | | **[PARTIAL]** on full round-trip UX | | |
| - [ ] | Import **SVG / DXF** (if tested) — preview and apply | | N/A if out of scope | | |

---

## K. Billing & profile

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | `/profile` loads — account info visible | | | | |
| - [ ] | Billing section shows current tier (Starter / Studio / Enterprise) | | | | |
| - [ ] | **Manage billing** / Stripe portal link opens (if subscribed) | | Use test mode if applicable | | |
| - [ ] | Export gating — tier-locked formats show upgrade prompt (if testable) | | N/A without paid test sub | | |
| - [ ] | Sign out from profile works | | | | |

---

## L. Collaboration preview **[PARTIAL]**

Preview UI only — **not** production co-editing.

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Collaboration bar visible in editor header (when feature enabled) | | | | |
| - [ ] | **Follow viewport** toggle — popover opens; list rows tappable (≥44px) | | **[PARTIAL]** — preview chrome only | | |
| - [ ] | Presence / share labels readable in landscape; compact in portrait | | | | |
| - [ ] | Do **not** expect live multi-user merge or conflict resolution | | Expected limitation | N/A | |

---

## M. Governance OS

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | `/spec-center` — loads; spec list readable on iPad | | | | |
| - [ ] | `/registry` — loads; tables/cards scroll | | | | |
| - [ ] | `/change-requests` — loads; primary actions tappable | | | | |
| - [ ] | `/releases` — **Release Center** loads | | | | |
| - [ ] | Release Center — **empty state** message clear (no signed-in data) | | **[PARTIAL]** — loading/empty states not fully evidenced | | |
| - [ ] | Release Center — **loading state** skeleton/spinner ( throttle network if needed) | | **[PARTIAL]** | | |
| - [ ] | `/audit` — **Audit Log** loads | | | | |
| - [ ] | Audit Log — **empty state** meaningful | | **[PARTIAL]** | | |
| - [ ] | `/world-records` — loads | | | | |
| - [ ] | `/optimization` — dashboard loads; prototype disclaimer visible | | | | |

---

## N. AI Copilot & uploads (smoke)

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Editor AI Designer entry opens without crash | | | | |
| - [ ] | File upload control — tap to pick photo/PDF from iPad Files | | | | |
| - [ ] | Upload progress / error states readable on touch | | | | |

---

## O. Performance & resilience (optional)

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Sample project with **10+ walls** — pan/zoom feels responsive | | Target ~16ms frame budget | | |
| - [ ] | No sustained jank during pinch zoom on large project | | Manual timing not automated | | |
| - [ ] | **Draft / Studio** performance profile switch (Properties → More) — applies on iPad | | | | |
| - [ ] | Background PWA 30s → foreground — app recovers; no data loss | | | | |

---

## P. Cast viewer

| Done | Test | Result | Notes | Tester | Date |
|:----:|------|--------|-------|--------|------|
| - [ ] | Open valid `/cast/:token` link — viewer loads | | Requires valid share token | | |
| - [ ] | Touch controls work on cast page (zoom/pan if exposed) | | | | |
| - [ ] | Invalid token — graceful error (not crash) | | | | |

---

## Known evidence gaps (from AGENTS.md)

Use this table to track what this manual pass can upgrade from **PARTIAL** to **PASS**:

| Area | Evidence status | What this sheet tests |
|------|-----------------|------------------------|
| Blueprint editor: draw wall, opening, properties | **PARTIAL** | Section F |
| Save/load/export/import on iPad Safari | **PARTIAL** (automated cloud PASS; iPad manual reload) | Section J |
| Release Center & Audit Log empty/loading states | **PARTIAL** | Section M |
| Collaboration preview | **PARTIAL** (preview only) | Section L |
| Home Screen PWA install | Manual only | Section A |
| Apple Pencil draw / palm rejection | Manual only | Section H |
| 16ms frame budget on iPad PWA | Manual only | Section O |

**Resolved in automated evidence (still verify on device):** Google OAuth sign-in · iPad/coarse-pointer Playwright layout · touch target CSS.

---

## Sign-off

| Field | Value |
|-------|-------|
| **Overall result** | Pass / Fail / Pass with exceptions |
| **Blocking failures** | |
| **Partial items accepted for this release?** | Yes / No — list IDs |
| **Evidence artifacts attached** | e.g. `ipad_homescreen.png`, screen recordings |
| **Tester signature** | |
| **Date** | |
| **Approver** | |
| **Approval date** | |

### Release recommendation

- [ ] **Ready for public iPad launch** — all critical sections Pass; no unresolved blockers
- [ ] **Ready for private beta only** — Partial items documented with workaround
- [ ] **Not ready** — blocking failures listed above

---

## Quick reference — routes under test

| Route | Surface |
|-------|---------|
| `/` | Landing |
| `/features` | Marketing |
| `/pricing` | Pricing (if enabled) |
| `/auth` | Sign in |
| `/reset-password` | Password reset |
| `/projects` | Project list |
| `/editor` | 2D/3D workstation |
| `/3d-room` | Standalone 3D (if linked) |
| `/profile` | Account & billing |
| `/optimization` | Optimization dashboard |
| `/spec-center` | Governance — specs |
| `/registry` | Governance — registry |
| `/change-requests` | Governance — changes |
| `/releases` | Release Center |
| `/audit` | Audit Log |
| `/world-records` | World records |
| `/cast/:token` | Shared cast viewer |

---

*Last updated: 2026-06-20 · Align with [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md) and [DEVICE_HARDENING_RUNBOOK.md](./DEVICE_HARDENING_RUNBOOK.md).*
