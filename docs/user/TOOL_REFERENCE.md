# Tool Reference

## Working tools

| Tool | Shortcut | Action |
|------|----------|--------|
| Select | V | Select walls; drag openings to reposition |
| Wall | W | Tap start and end points |
| Door | D | Tap a wall to place a door |
| Window | N | Tap a wall to place a window |
| Measure | M | Inspect wall and opening dimensions |
| Label | T | Tap canvas to place a room label |
| Dimension | Shift+M | Tap two points to create a dimension line |

View toggles: 3D preview (Sacred 3D View), grid, snap-to-grid.

## Stub tools (coming soon)

Room, Vastu, MEP, Furniture, and Landscape appear in the tool rail but are **not** on-canvas yet. See [STUB_TOOLS.md](./STUB_TOOLS.md).

## Export formats

| Format | Fidelity | Doc |
|--------|----------|-----|
| JSON | Full project manifest (round-trip) | — |
| PNG | Walls-only raster | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| PDF | Text summary sheet | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| DXF | Basic LINE entities | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |

JSON is the only format suitable for production backup and re-import.
