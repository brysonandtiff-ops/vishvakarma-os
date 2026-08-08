# Vishvakarma.OS — UI + Functionality Pass

**Date:** 2026-05-22 Australia/Perth  
**Scope:** iPad-first blueprint editor usability, touch/Pencil workflow, official Vishvakarma visual direction, export workflow.  
**Status:** Implemented in repo. Runtime verification still required on Vercel deployment.

## Changes

| Area | Improvement | Evidence |
|---|---|---|
| Canvas input | Replaced mouse-only canvas handlers with pointer events so mouse, touch, and Pencil-style input use the same drawing path | `src/components/editor/BlueprintCanvas.tsx` |
| Canvas touch behavior | Added `touch-none` / `select-none` canvas behavior to stop browser scrolling/selection during drawing | `src/components/editor/BlueprintCanvas.tsx`, `src/vish-theme.css` |
| Tool rail | Increased tool target size and improved active/hover states for iPad use | `src/components/editor/ToolRail.tsx`, `src/vish-theme.css` |
| Tool guidance | Added better tooltip hints for Select, Wall, Door, Window, Measure, 3D, Grid, and Snap | `src/components/editor/ToolRail.tsx` |
| Touch command strip | Wired `EditorCommandStrip` into the live editor so users can access Wall, Door, Window, Measure, 3D, Grid, Snap, Sample, and Export without menu digging | `src/components/editor/EditorCommandStrip.tsx`, `src/pages/EditorPage.tsx` |
| Export workflow | Replaced direct raw export action with an `Export Floor Plan` confirmation dialog showing project name, wall count, opening count, and export action | `src/pages/EditorPage.tsx` |
| Editor simplification | Simplified the editor header and removed menu-heavy dependence from the main workflow | `src/pages/EditorPage.tsx` |
| Visual system | Reinforced cream drafting-board canvas, black rails, warm gold selected/active states | `src/vish-theme.css` |
| Brand governance | Brand lock remains the canonical UI direction: official swan/V logo, black/gold auth/loading, cream drafting workspace | `docs/BRAND_LOCK.md` |

## Acceptance checks to run after deploy

- [ ] Open `/` on tablet width.
- [ ] Draw a wall with mouse.
- [ ] Draw a wall with touch/Pencil input.
- [ ] Place a door on a wall.
- [ ] Place a window on a wall.
- [ ] Toggle Grid from command strip.
- [ ] Toggle Snap from command strip.
- [ ] Toggle 3D preview from command strip.
- [ ] Load Sample Project from command strip.
- [ ] Open Export Floor Plan dialog from command strip.
- [ ] Export JSON from the dialog.
- [ ] Confirm active tool is clearly gold-highlighted.
- [ ] Confirm canvas does not scroll the page while drawing.

## Stop-ship findings

- Runtime verification has not yet been attached.
- GitHub Actions status still needs to be checked after the latest commits.
- Vercel screenshots still need to be attached to the evidence manifest.

## Next pass

1. Add Playwright smoke for `/`, canvas visibility, command strip visibility, tool rail visibility, and `/auth` redirect.
2. Add PNG/SVG export option after the JSON export dialog is verified.
3. Attach Vercel screenshots to the evidence manifest.
