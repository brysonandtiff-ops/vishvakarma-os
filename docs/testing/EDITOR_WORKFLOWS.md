# Editor workflow tests

Vitest coverage for blueprint editor interactions: tool selection, canvas selection, radial menu, and keyboard wiring.

## Location

| File | Scope |
|------|--------|
| `src/test/canvasSelection.test.ts` | Marquee hit-testing, Shift+click toggle helpers |
| `src/test/editorWorkflow.test.ts` | Source wiring for tools, multi-select, radial polish |
| `src/test/RadialToolMenu.test.tsx` | Radial tool picker render + interaction |
| `src/test/ToolRail.test.tsx` | Tool rail buttons and active state |
| `src/test/editorChrome.test.ts` | Shared `toolMeta` across rail, status bar, radial |
| `src/test/editorVisualPolish.test.ts` | Stylesheet and editor chrome regression anchors |

## Flows covered

### Tool selection

- Tool rail activates tools and shows draft-mode tools (Room, Vastu, Column, Stair).
- Radial menu exposes the drafting ring (Wall, Door, Window, Measure, Label, Dimension, Column, Stair) with keyboard tooltips.
- Keyboard shortcuts: `V/W/D/N/M/T/F/C/U`, `Shift+M` (dimension), `Shift+S` (snap), `G` (grid), `3` (3D).

### Canvas selection

- Click selects a single wall.
- Shift+click toggles walls in a multi-selection set.
- Drag on empty canvas draws a marquee; release selects intersecting walls.
- Escape cancels an in-progress marquee.
- Delete/Backspace removes all selected walls.

### Placement tools

- **Column** — places a structural column marker (furniture preset `column`).
- **Stair** — places a staircase symbol; each tap cycles run direction (0°, 90°, 180°, 270°).

## Run

```bash
pnpm run test -- src/test/canvasSelection.test.ts src/test/editorWorkflow.test.ts src/test/RadialToolMenu.test.tsx src/test/ToolRail.test.tsx
```

Full editor regression:

```bash
pnpm run test
pnpm run lint:types
```

## Manual smoke (optional)

1. Open `/editor`, load demo blueprint or draw walls.
2. Press `V`, Shift+click two walls, press Delete — both should remove.
3. Press `C` and tap canvas — column marker appears.
4. Press `U` repeatedly — stair symbols rotate direction.
5. Activate Wall tool — radial ring follows cursor; pick Door from ring.
