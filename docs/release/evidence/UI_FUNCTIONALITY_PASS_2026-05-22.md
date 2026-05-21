# Vishvakarma.OS — UI + Functionality Pass

**Date:** 2026-05-22 Australia/Perth  
**Scope:** iPad-first blueprint editor usability, touch/Pencil workflow, official Vishvakarma visual direction.  
**Status:** Implemented in repo. Runtime verification still required on Vercel deployment.

## Changes

| Area | Improvement | Evidence |
|---|---|---|
| Canvas input | Replaced mouse-only canvas handlers with pointer events so mouse, touch, and Pencil-style input use the same drawing path | `src/components/editor/BlueprintCanvas.tsx` |
| Canvas touch behavior | Added `touch-none` / `select-none` canvas behavior to stop browser scrolling/selection during drawing | `src/components/editor/BlueprintCanvas.tsx`, `src/vish-theme.css` |
| Tool rail | Increased tool target size and improved active/hover states for iPad use | `src/components/editor/ToolRail.tsx`, `src/vish-theme.css` |
| Tool guidance | Added better tooltip hints for Select, Wall, Door, Window, Measure, 3D, Grid, and Snap | `src/components/editor/ToolRail.tsx` |
| Visual system | Reinforced cream drafting-board canvas, black rails, warm gold selected/active states | `src/vish-theme.css` |
| Brand governance | Brand lock remains the canonical UI direction: official swan/V logo, black/gold auth/loading, cream drafting workspace | `docs/BRAND_LOCK.md` |
| Fast command scaffold | Added `EditorCommandStrip` as a touch-first command-strip component for the next visible integration pass | `src/components/editor/EditorCommandStrip.tsx` |

## Acceptance checks to run after deploy

- [ ] Open `/` on tablet width.
- [ ] Draw a wall with mouse.
- [ ] Draw a wall with touch/Pencil input.
- [ ] Place a door on a wall.
- [ ] Place a window on a wall.
- [ ] Toggle Grid.
- [ ] Toggle Snap.
- [ ] Toggle 3D preview.
- [ ] Load Sample Project.
- [ ] Export JSON.
- [ ] Confirm active tool is clearly gold-highlighted.
- [ ] Confirm canvas does not scroll the page while drawing.

## Stop-ship findings

- Runtime verification has not yet been attached.
- `EditorCommandStrip` exists but is not yet wired into `EditorPage`; wire it in the next pass after CI/build check.
- GitHub Actions status still needs to be checked after the latest commits.

## Next pass

1. Wire `EditorCommandStrip` into the top editor workspace.
2. Improve export from raw JSON to a clearer floor-plan export dialog.
3. Add Playwright smoke for `/`, canvas visibility, tool rail visibility, and `/auth` redirect.
4. Attach Vercel screenshots to the evidence manifest.
