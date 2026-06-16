# Multi-Device Hardening Audit

Generated at: 2026-06-15  
Result: **PASS** — automated Playwright coverage across iPad, iPhone, Android tablet, desktop, governance, marketing, and collaboration preview chrome

## Device coverage matrix

| Device | Viewport preset | Surfaces tested | Spec |
|--------|-----------------|-----------------|------|
| iPad Pro 12.9" landscape | 1180×820 | Editor, all governance routes, marketing | `ipad-editor-layout.spec.ts`, `device-governance-layout.spec.ts`, `device-marketing-layout.spec.ts` |
| iPad portrait | 820×1180 | Editor, governance, marketing | Same specs |
| iPhone 14/15 portrait | 390×844 | Editor, marketing, cast viewer | `device-phone-editor.spec.ts`, `device-marketing-layout.spec.ts`, `device-governance-layout.spec.ts` |
| Android tablet landscape | 1280×800 + coarse pointer | Projects, editor smoke | `device-governance-layout.spec.ts` |
| Desktop fine pointer | 1280×800 | Walk mode pointer-lock hint | `device-desktop-layout.spec.ts` |

## WebGL resilience (mobile GPU reset)

iPad Safari, backgrounded PWAs, and Android Chrome under memory pressure routinely
drop the WebGL context (`webglcontextlost`). This is an async canvas event, so the
React `WebGLErrorBoundary` cannot catch it. The 3D viewport now:

- Listens for `webglcontextlost` / `webglcontextrestored` on the canvas
  (`WebGLContextGuard` in `src/components/editor/Viewport3D.tsx`)
- Calls `preventDefault()` so the browser attempts automatic restoration, then
  `invalidate()`s the demand frameloop to repaint the re-uploaded scene
- Shows a non-blocking "Restoring 3D view…" overlay with a manual **Reload 3D view**
  control that remounts the canvas with a fresh context if auto-recovery never fires
- Keeps the 2D blueprint editor fully usable throughout

Enforced by `device-hardening:gates` (checks for the context-loss listeners in source).

## Touch target standard

Minimum **44×44 px** on all interactive controls (Apple HIG). Enforced via:

- `.touch-target` utility and `(pointer: coarse)` CSS in `ipad-workspace.css` and `vish-marketing.css`
- Playwright `assertTouchTargets()` in `e2e/deviceTouchTargets.ts`

## Related evidence

- [ipad-touch-audit.md](./ipad-touch-audit.md) — editor canvas gestures (legacy iPad-focused audit)
- [collaboration-preview-hardening.md](./collaboration-preview-hardening.md) — preview collab bar only
- [DEVICE_HARDENING_RUNBOOK.md](../DEVICE_HARDENING_RUNBOOK.md) — manual physical iPad steps

## Manual follow-up (operator)

Physical device proof is **not** automated:

- Safari Add to Home Screen + standalone launch
- Apple Pencil hover/draw on blueprint canvas
- Measured 16ms frame budget on iPad Safari PWA

See the runbook for step-by-step capture instructions.

## CI gate

`pnpm run device-hardening:gates` verifies CSS tokens, PWA viewport metadata, marketing coarse rules, and required E2E spec files exist.
