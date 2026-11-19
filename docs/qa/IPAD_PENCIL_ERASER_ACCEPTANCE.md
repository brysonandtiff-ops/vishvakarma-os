# 2D Pencil / Eraser — Device Acceptance Gate

**Work order:** Vishvakarma.OS 2D finger, mouse, USB stylus, and Apple Pencil input.
**Source:** `src/components/editor/BlueprintCanvas.tsx`, `blueprint/freehandWalls.ts`, `floorPlanEngine.ts`.
**Evidence status:** SOURCE IMPLEMENTED ON FEATURE BRANCH; NOT YET REAL-DEVICE VERIFIED.
**Protected visual direction:** Existing Vishvakarma tool-rail and paper-canvas theme unchanged.

## Automated acceptance (run on this branch)

- `pnpm run lint:types` — TS type checks.
- `pnpm exec vitest run src/test/freehandWalls.test.ts src/test/ToolRail.test.tsx src/test/editorWorkflow.test.ts src/test/inputHandlers.test.ts`.
- `pnpm exec playwright test --config=playwright.deep-proof.config.ts` — existing wall/opening regression.
- `pnpm exec playwright test e2e/ipad-editor-current-contract.spec.ts` — simulated touch/Pencil events. Use a config with this spec enabled.
- `pnpm run build` — production bundle.
- `pnpm run repairbot:medium` before declaring ready.

## Physical iPad Safari / Apple Pencil acceptance (not simulated)

1. Load a blank project. In **Pencil** tool, draw a long bent wall with Pencil tip and a second wall with one finger. Verify the complete visible line and matching editable walls in 2D and 3D.
2. Select **Eraser**. Rub over both drawn walls using a finger and then a Pencil tip. Confirm exact deletion without physically flipping the Pencil. Undo one rub gesture and confirm recovery.
3. Rest palm on screen while drawing with Pencil. Confirm no stray wall creation. Pinch and two-finger pan, then draw again without interrupted input.
4. Test straight **Wall** tool, doors/windows, Undo/Redo, project save, close Safari, reopen project, and confirm walls persist in 2D and 3D.
5. Repeat portrait/landscape, screen zoom and iPad Home Screen PWA. If USB stylus hardware is available, separately check ordinary tip and a hardware eraser button/end. Check mouse interaction on desktop.

## Required evidence before release

Record genuine screenshots of pencil/eraser selections, 2D and 3D before/after, a short real-device screen recording showing draw / erase / undo / save-reopen, tested iPad model and iPadOS/Safari version, exact source SHA and test logs. Do not call a synthetic browser PointerEvent test a real Apple Pencil test.

**Known design trade-off:** Pencil freehand strokes become simplified, connected architectural wall segments (not an independent sketch/ink layer); verify dimensions and material before building from a plan. Eraser removes whole wall/opening objects, not pixels or part of a wall.
