# Vishvakarma.OS — Master Notes

This file consolidates Bryson's current notes, constraints, design direction, VIP ZIP takeaways, release rules, and next-build order for Vishvakarma.OS.

Last updated: 2026-07-03.

## 1. Product identity

Vishvakarma.OS is a browser-native architectural operating system:

- iPad-first, but must work on iPhone, Android, desktop, and installed PWA/fullscreen modes.
- Core promise: draw in 2D, inspect in live Sacred 3D View, govern every change, export proof.
- Brand world: sacred architecture, swan logo, obsidian/gold glass, blue/cyan depth, Devanagari/sacred visual accents, professional workstation UI.
- Tone: premium, serious, proof-driven, world-standard, not a toy demo.

## 2. Hard rules

These rules override all future patches:

1. Do not break working production.
2. Do not replace the main editor wholesale.
3. Do not import the VIP ZIP app shell/router/auth stack wholesale.
4. Google SSO through Supabase is the only production login path.
5. No email/password, magic-link, Apple, GitHub, or local demo login should appear on the production auth UI.
6. Keep the current full studio editor as the flagship editor.
7. Keep `/editor-lite` as a stable recovery/lite editor path adapted from the working VIP editor pattern.
8. Keep all pages truthful: Available, Preview, Cloud-required, Local, Disabled, or Manual must be visually clear.
9. No dead buttons, no fake production claims, no placeholder-looking key pages.
10. No horizontal overflow on iPhone, iPad portrait, iPad landscape, desktop, or PWA fullscreen.
11. Every major patch must preserve or improve iPad usability and touch targets.
12. Do not force-push, rewrite, rebase, amend, or squash published Lovable-connected history when working on Lovable branches.

## 3. Current repo direction

Current live direction after recent patches:

- `/` uses the VIP-inspired landing layout but keeps the real Vish routes, images, auth-aware CTA logic, and governance proof language.
- `/auth` is Google SSO-only.
- `/editor` remains the advanced full studio.
- `/editor-lite` is the stable working 2D/3D recovery path.
- `/features` must show truthful Available vs Preview labels.
- `/pricing` must not overclaim billing until Stripe/Supabase state is live and verified.
- `/projects`, `/profile`, `/spec-center`, `/registry`, `/change-requests`, `/releases`, `/world-records`, `/audit`, `/optimization` must remain reachable and visually consistent.

## 4. VIP ZIP takeaways

The VIP ZIP is useful, but only selectively.

Use these:

- Strong 2-column landing hero.
- Status/version pill.
- App-window-style product preview frame.
- Compact proof pills.
- Clear feature grid.
- Governance strip.
- Product rooms: Drafting, Sacred 3D, Governance, Delivery.
- Simple working editor pattern: wall drawing, snap/grid, select, doors, windows, pan, undo/redo, 2D + live 3D preview.
- Obsidian/gold visual language.
- Cream/dark zone thinking.
- 44px+ touch target philosophy.
- Evidence-first wording.

Do not use these:

- VIP auth flow if it includes password, email magic link, or alternative login paths.
- VIP routing structure if it conflicts with current React Router app.
- VIP Supabase client/server setup if it conflicts with existing Supabase integration.
- VIP shell as a replacement for Vish's existing workspace shell.
- Any fake claims or stubbed controls that look production-ready.

## 5. Device and performance notes

Device support must cover:

- iPhone portrait.
- iPhone landscape.
- iPad portrait.
- iPad landscape.
- Desktop 1280+.
- Large desktop 1440+.
- Installed PWA/fullscreen mode.
- Safari/iPadOS viewport safe-area behavior.

Performance/FPS hardening expectations:

- Avoid excessive blur/shadow on touch devices.
- Use viewport-safe `100svh`/`100dvh` handling.
- Keep editor/workspace height locked to the real visual viewport.
- Add scroll containment around canvas, panels, dialogs, sheets, and popovers.
- Keep 3D rendering adaptive: demand rendering, adaptive frame governor, WebGL precheck, WebGL context-loss recovery, and fallback states.
- Prefer presentational CSS hardening before risky engine rewrites.

## 6. Auth notes

Auth direction:

- Production login path is Google SSO via Supabase OAuth only.
- Auth UI must show one clear primary button: Continue with Google SSO.
- Embedded browser handling should offer open-in-browser/copy URL recovery if OAuth is blocked.
- Supabase dashboard still needs manual provider verification when possible:
  - Google enabled.
  - Email/password disabled if backend-level exclusivity is required.
  - Magic link/OTP disabled if exposed.
  - Other providers disabled.
  - Redirect URLs include production domain and auth route.

## 7. Editor notes

Main editor `/editor` must stay the flagship:

- Full floor-plan engine.
- Walls, openings, floors, labels, dimensions, rooms, furniture, MEP, fixtures, staircases, landscape, terrain, materials.
- 2D canvas.
- Tool rail.
- Properties panel/sheet.
- Save state and local draft recovery.
- Cloud/local save status.
- Sample loader.
- Export dialog.
- 3D viewport.
- Compliance/proof panels.
- Tutorial and guided-start systems.
- iPad and desktop polish.

Lite editor `/editor-lite` exists because the VIP editor had a strong working interaction loop. Its job:

- Fast simple 2D editing.
- Stable wall/door/window workflow.
- Snap/grid.
- Undo/redo.
- Export JSON manifest.
- Live 3D using the current Vish `Viewport3D` renderer.
- Recovery path if the full studio feels too heavy.
- It must not replace `/editor`.

## 8. Landing/page layout notes

The landing page should communicate clearly in this order:

1. Status/version pill.
2. Strong headline.
3. Auth-aware primary CTA.
4. Secondary feature CTA.
5. Lite Editor CTA.
6. Proof pills.
7. Product preview frame.
8. Studio workflow section.
9. Governance proof strip.
10. Product rooms.
11. 2D/3D/export screenshots.
12. Professional delivery proof.
13. Final CTA.

Product rooms:

- Drafting room → `/editor-lite`.
- Sacred 3D room → `/editor`.
- Governance room → `/releases` or `/spec-center`.
- Delivery room → `/projects`.

## 9. Evidence and QA notes

Required proof runs:

```bash
pnpm exec playwright test --config=playwright.full-customer-audit.config.ts
pnpm run test:screenshots
pnpm run capture:page-references
```

Audit coverage must include:

- Google-only auth on desktop, iPad, phone portrait, phone landscape.
- No email/password/magic-link/local login UI.
- Full editor sample load.
- Tool rail controls: Wall, Door, Window, Room.
- 3D preview.
- Export dialog.
- Lite editor `/editor-lite`: 2D canvas, 3D pane, Select, Wall, Door, Window, Pan, Delete, Export JSON.
- No horizontal overflow.
- Touch target checks.

Known CI concern from notes:

- Some GitHub Actions/e2e runs showed `No jobs were run` on recent branches. Future work must check workflow triggers/config so CI actually executes the intended jobs.

## 10. Truthfulness labels

Every feature and CTA must clearly signal state:

- Available: works now.
- Preview: partially working or manually constrained.
- Cloud-required: requires Supabase/auth/live backend.
- Manual evidence: operator must verify in production/staging.
- Disabled: not usable yet.

Do not present disabled/preview/cloud-required controls as fully live production actions.

## 11. Phase plan carried from the VIP notes

The uploaded VIP plan suggested 4 broad phases. Current Vish already has much of this built, but the phase language is useful for planning.

### Phase 1 — Foundation / Marketing / Auth / Workspace

Current status: mostly implemented.

Must stay true:

- Landing.
- Features.
- Pricing.
- Google SSO auth.
- Projects.
- Profile.
- Workspace shell.

### Phase 2 — Blueprint Editor

Current status: advanced full studio exists, plus `/editor-lite` recovery path.

Keep improving:

- Draw walls.
- Snap/grid.
- Door/window placement.
- Sample project.
- 3D preview.
- Export package.
- Autosave/local draft.
- Keyboard shortcuts.
- iPad gesture/touch polish.

### Phase 3 — Governance Console

Current status: core routes exist.

Keep improving:

- Spec Center.
- Registry.
- Change Requests.
- Releases.
- Audit.
- World Records.
- Optimization / Design Battle.
- Truthful local/cloud state.
- Role-gated write actions.

### Phase 4 — Billing / Polish / Release Quality

Current status: partially implemented.

Keep improving:

- Stripe/billing verification.
- Full device audit.
- Accessibility sweep.
- Visual regression.
- Screenshot evidence.
- Monitoring/rollback.
- Production deploy proof.

## 12. Next build order

Recommended next work, in order:

1. Fix GitHub Actions/e2e workflow issue where runs report `No jobs were run`.
2. Regenerate screenshot evidence after latest landing and editor-lite changes.
3. Add `/editor-lite` to screenshot pack and page reference pack.
4. Run local full customer audit and capture failures.
5. Patch any real visual/device issues found in the generated screenshots.
6. Verify Supabase provider toggles for true Google-only backend enforcement.
7. Run production route smoke: `/`, `/auth`, `/editor`, `/editor-lite`, `/features`, `/pricing`, `/projects`, `/releases`, `/audit`.
8. Review toolbar/Vercel comments if any.
9. Only then make stronger production-readiness claims.

## 13. Plain-English product summary

Vishvakarma.OS is now positioned as:

> A premium, iPad-first architectural operating system where a user can draft in 2D, inspect a live Sacred 3D view, save/export governed proof, and move through a professional workspace with clear evidence, route safety, and truthful feature states.

The product should feel powerful, sacred, clean, and credible — never messy, never fake, never overclaimed.
