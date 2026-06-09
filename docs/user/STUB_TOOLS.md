# Extended ToolRail — Capability Status

The ToolRail shows **base drafting tools** on every mode plus **mode-specific tools**. All listed tools are wired to the canvas and `FloorPlanEngine` manifest in this release.

## Base tools (all modes)

| Tool | Shortcut | Behavior |
|------|----------|----------|
| Select | V | Select walls and openings |
| Wall | W | Tap start, tap end |
| Door | D | Tap a wall to place |
| Window | N | Tap a wall to place |
| Measure | M | Inspect dimensions |
| Label | T | Place room label |
| Dimension | Shift+M | Dimension line |

## Mode tools

| Tool | Mode | Behavior |
|------|------|----------|
| **Room** | Draft | Detect enclosed areas and label rooms |
| **Vastu** | Draft | Harmony compass overlay; sidebar panel |
| **MEP** | MEP | Place MEP symbols on plan |
| **Furniture** | Interior | Place furniture items |
| **Landscape** | Landscape | Garden / exterior elements |

## Partial / roadmap UI

| Control | Location | Status |
|---------|----------|--------|
| Real-time collaboration | Collaboration bar | Requires Firebase Realtime (v2) |
| Compass orientation pill | Canvas overlay | Read-only preview in some builds |

Each tool reads/writes **`FloorPlanEngine` manifest only** — no parallel geometry state.
