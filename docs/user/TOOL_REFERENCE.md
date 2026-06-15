# Tool Reference

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  

Editor tools available from the tool rail in `/editor`. **Production** = shipped and verified. **Preview** = scaffold or partial implementation.

---

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

Room, Vastu, MEP, Furniture, and Landscape are functional on-canvas tools. Vastu includes an 8-sector overlay when the Vastu tool is active. See [STUB_TOOLS.md](./STUB_TOOLS.md).

## Export formats

| Format | Fidelity | Doc |
|--------|----------|-----|
| JSON | Full project manifest (round-trip) | — |
| PNG | Walls-only raster | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| PDF | Text summary sheet | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| DXF | Basic LINE entities | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |

JSON is the only format suitable for production backup and re-import.
