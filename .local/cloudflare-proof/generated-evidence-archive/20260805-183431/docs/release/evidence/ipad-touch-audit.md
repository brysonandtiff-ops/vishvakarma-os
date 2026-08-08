# iPad / Touch Target Audit

Generated from commit: automated touch-input polish pass
Generated at: 2026-06-15
Operator: automated Playwright coarse-pointer + gesture checks
Result: PASS — editor touch chrome and canvas gestures covered in Playwright

## Minimum 44x44 px target

- Tool rail buttons use min-height/min-width touch targets via editor CSS.
- Auth page controls validated in Playwright at tablet viewports.
- Pan tool, zoom +/- controls, minimap wrapper, and 3D walk D-pad use 44px targets.

## Canvas touch gestures (2D blueprint)

- Two-finger pinch zoom and pan via `canvasTouchGestures` + `BlueprintCanvas` pointer router.
- Pan tool (Hand) for one-finger canvas pan on touch and pen devices.
- Pen hover snap preview, coalesced wall draw events, eraser button select/deselect.
- Palm rejection: touch ignored while pen pointer is active.

## Automated Checks

- Playwright `ipad-editor-layout.spec.ts`: coarse pointer media, 44px targets, zoom +/-, Pan tool rail, minimap pointer tap, wheel zoom
- Unit tests: `canvasTouchGestures.test.ts`, `canvasViewportZoom.test.ts`, `inputHandlers.test.ts`, `RadialToolMenu.test.tsx`

## Manual Follow-up

- Physical iPad + USB graphics tablet draw pass on blueprint canvas remains recommended before public launch
- Verify Apple Pencil hover preview on device (browser-dependent)
