# iPad / Touch Target Audit

Generated from commit: pending iPad full hardening pass
Generated at: 2026-06-13
Operator: Bryson Erdmann — Playwright iPad viewport + coarse-pointer touch audit
Result: PASS (automated)

## Minimum 44x44 px target

- Tool rail buttons use min-height/min-width touch targets via editor CSS and `.architect-tool-button` coarse rules.
- Editor top bar, menubar, properties delete, radial menu (desktop only), 3D atmosphere toggles, and notifications use `touch-target` / coarse rules in `ipad-workspace.css`.
- Auth page controls validated in Playwright at tablet viewports with safe-area + keyboard inset CSS.

## Canvas + input hardening

- `BlueprintCanvas` scales pointer coordinates when CSS display size differs from buffer size.
- Responsive canvas buffer via `useCanvasResize` (ResizeObserver, DPR capped at 2).
- Label edit: second tap on selected label (select tool) opens inline edit; double-click retained for desktop.
- `touch-manipulation` on canvas container reduces iOS double-tap zoom.

## Auth + keyboard

- Auth gate uses `100dvh`, safe-area padding, and `visualViewport` bottom inset when keyboard opens.
- Viewport meta includes `interactive-widget=resizes-content`.

## PWA shell cache

- `vite-plugin-pwa` precaches static shell/assets with `autoUpdate` registration.
- API/auth routes remain network-first (no offline editor).

## Automated Checks

- `e2e/ipad-editor-layout.spec.ts` — editor at 1180×820 and 820×1180; responsive canvas; 3D panel portrait; expanded touch-target selectors
- `e2e/ipad-production-readiness.spec.ts` — PWA metadata, service worker registration, auth layout
- `e2e/auth-gate.spec.ts` — auth at 810×1080 and 1080×810
- Unit: `canvasPointerCoords.test.ts`, `atmosphereMode.test.ts`, `copilotUploadIpad.test.ts`
- Evidence screenshots: `ipad-editor-landscape.png`, `ipad-3d-panel.png` (Playwright capture)

## Manual Follow-up (physical iPad)

1. Safari → Share → Add to Home Screen; confirm standalone launch.
2. Complete Google OAuth return flow from Home Screen app.
3. Email keyboard on `/auth` — submit button remains reachable.
4. Files/Photos picker for import and copilot uploads.
5. Capture `ipad_homescreen.png` for release evidence.

## Verdict

```txt
Result: PASS (automated)
Physical Home Screen install: manual checklist required
```
