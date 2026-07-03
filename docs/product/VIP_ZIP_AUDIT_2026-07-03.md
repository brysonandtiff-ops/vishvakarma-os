# VIP ZIP Audit — 2026-07-03

Source inspected: `Seamless Experience Upgrade (2).zip`.

The ZIP contains 98 files and is a separate Lovable/TanStack-style application. It is useful as design/product inspiration, but it must not be copied wholesale into Vishvakarma.OS because Vish already has a mature React Router app shell, Supabase integration, Google SSO-only auth direction, full studio editor, governance routes, evidence docs, and Vercel production deployment.

## What was inspected

Representative ZIP areas reviewed:

- `.lovable/plan.md`
- `AGENTS.md`
- `src/routes/index.tsx`
- `src/routes/features.tsx`
- `src/routes/pricing.tsx`
- `src/routes/auth.tsx`
- `src/routes/_authenticated/projects.tsx`
- `src/routes/_authenticated/profile.tsx`
- `src/routes/_authenticated/editor.$projectId.tsx`
- `src/components/editor/viewport-3d.tsx`
- `src/components/workspace/workspace-shell.tsx`
- `src/components/site/site-header.tsx`
- `src/components/site/site-footer.tsx`
- `src/lib/editor-manifest.ts`
- `src/lib/error-capture.ts`
- `src/lib/error-page.ts`
- `src/styles.css`
- bundled assets including `sacred-3d-hero.jpg` and `vishvakarma-deity.jpg`

## Accepted into Vish

### 1. Landing layout pattern

Transferred into current `/`:

- Status/version pill.
- Stronger hero headline.
- Product-preview app window frame.
- Proof pills.
- Governance strip.
- Product rooms: Drafting, Sacred 3D, Governance, Delivery.
- Cleaner CTA hierarchy including Lite Editor.

Why accepted: visual/layout only, no auth/router/data conflict.

### 2. Lite Editor interaction pattern

Transferred into current `/editor-lite`:

- Simple wall drawing.
- Snap/grid.
- Select/pan/delete.
- Door/window placement on walls.
- Undo/redo.
- Export JSON.
- Live 3D preview via current Vish `Viewport3D` renderer.

Why accepted: gives users a stable recovery editor without replacing the full studio.

### 3. Visual design takeaways

Folded into current final visual hardening layer:

- Obsidian/gold glass treatment.
- Gold CTA gradient.
- App-window ornamentation.
- Stronger card depth.
- Professional proof-first tone.
- Touch-device performance safety.

Why accepted: improves look while preserving existing app structure.

### 4. Evidence expectations

Transferred into docs and tests:

- `/editor-lite` is now part of release screenshot evidence.
- The screenshot pack now checks full editor plus Lite Editor recovery path.
- Page-reference refresh notes now include landing VIP layout and Lite Editor.

Why accepted: improves proof quality and prevents useful new routes becoming hidden/unverified.

### 5. Planning language

Transferred into `docs/product/VISHVAKARMA_MASTER_NOTES.md`:

- Phase 1: Foundation / Marketing / Auth / Workspace.
- Phase 2: Blueprint Editor.
- Phase 3: Governance Console.
- Phase 4: Billing / Polish / Release Quality.

Why accepted: useful for roadmapping, but adapted to current Vish state.

## Rejected from direct copy

### 1. Auth stack

Rejected:

- Email magic-link login.
- Password-style UI.
- Alternate provider assumptions.
- ZIP auth broker assumptions.

Reason: Vish production direction is Google SSO-only through Supabase.

### 2. App router and shell

Rejected:

- TanStack route tree as a replacement.
- ZIP root shell as a replacement.
- ZIP `_authenticated` route structure as a replacement.

Reason: Vish already has React Router, route manifest, route guards, immersive editor shell, marketing layout, governance layout, and workspace layouts.

### 3. Supabase integration rewrite

Rejected:

- ZIP Supabase client/server setup.
- ZIP server functions.
- ZIP table assumptions as a direct overwrite.

Reason: Vish already has Supabase integration and current auth state; any backend change must be audited separately.

### 4. 3D renderer replacement

Rejected:

- ZIP simple Three.js renderer as a replacement for current `Viewport3D`.

Reason: Current Vish `Viewport3D` is more advanced: WebGL precheck, context-loss recovery, adaptive frame governor, demand rendering, atmosphere modes, multi-floor support, furniture/MEP/fixtures/terrain/rooms, and fallback states.

### 5. Binary deity/hero asset replacement

Rejected for automatic copy:

- `vishvakarma-deity.jpg`
- `sacred-3d-hero.jpg`

Reason: current app already has product screenshots and official user-supplied swan/logo direction. New assets can be considered later after visual review, but should not silently replace live product evidence.

## Extra improvements recommended by this audit

1. Fix GitHub Actions/e2e workflow cases that show `No jobs were run`.
2. Add `/editor-lite` to any remaining page reference automation, not only release screenshots.
3. Add a route smoke job for `/`, `/auth`, `/editor`, `/editor-lite`, `/features`, `/pricing`, `/projects`, `/releases`, `/audit`.
4. Add a small landing-page screenshot assertion that the product rooms exist and point to real routes.
5. Add Supabase dashboard-level provider verification evidence for true Google-only backend enforcement.
6. Add a real iPad Safari capture for `/editor-lite` and `/editor` side by side.
7. Consider a later controlled review of the two ZIP image assets before adding them to marketing.
8. Keep full studio and Lite Editor clearly differentiated in UI copy.

## Current decision

The ZIP has now been used correctly:

- Layout ideas were accepted.
- Working editor interaction ideas were accepted.
- Evidence improvements were accepted.
- Risky auth/router/backend replacement was rejected.

This preserves Vishvakarma.OS as the main product while still benefiting from the strongest VIP concepts.
