# Tool Reference

**Product version:** v1.5.0  
**Last verified:** 2026-06-20  
**Audience:** user  

Editor tools available from the tool rail in `/editor`. Use the command palette (`Ctrl+K` / `Cmd+K`) to search routes, tutorials, and guided tool walkthroughs.

---

## Core drafting tools

| Tool | Shortcut | Action | Best next step |
|------|----------|--------|----------------|
| Select | V | Select walls, openings, labels, dimensions, and placed items | Edit details in Properties |
| Wall | W | Tap start and end points to draw wall segments | Close a room shell, then add openings |
| Door | D | Tap a wall to place a door | Drag handles or inspect in 3D |
| Window | N | Tap a wall to place a window | Toggle 3D to verify placement |
| Measure | M | Inspect wall and opening dimensions | Use Dimension for persistent annotations |
| Label | T | Tap canvas to place a room label | Rename labels for export clarity |
| Dimension | Shift+M | Tap two points to create a dimension line | Press Shift+D to show/hide dimensions |

View toggles: 3D preview (Sacred 3D View), grid, snap-to-grid, layer controls, and presentation mode where available.

---

## Mode-specific tools

| Tool / mode | Where | Action | Tutorial |
|-------------|-------|--------|----------|
| Room | Draft/editor canvas | Detect or annotate enclosed room regions | Your First Floor Plan |
| Vastu | Draft mode | Place and inspect the eight-sector Vastu overlay | Vastu Harmony |
| MEP | MEP mode | Place mechanical, electrical, and plumbing symbols | MEP Routing |
| Furniture | Interior mode / F | Place furniture on the plan and inspect in 3D | Materials & Interior |
| Landscape | Tool rail | Add exterior landscape elements where supported | Essentials / 3D review |
| Terrain | Tool rail | Draw terrain patches and inspect 3D extrusion | Sacred 3D View |
| Walk mode | 3D controls | Navigate the model from a first-person perspective | Sacred 3D View |

Some advanced tools are still marked preview in the product docs when implementation is partial. See [STUB_TOOLS.md](./STUB_TOOLS.md) before promising full production behavior to customers.

---

## Navigation and learning tools

| Tool | Shortcut / route | Use it for |
|------|------------------|------------|
| Command palette | Ctrl+K / Cmd+K | Jump to routes, start tutorials, search Learn commands |
| Tutorial hub | Command palette → Learn | Start Essentials or topic-specific guided tours |
| Projects Library | `/projects` | Search, duplicate, archive, and reopen saved projects |
| Design Optimization | `/optimization` | Run candidate scoring and promote a preferred layout |
| Profile | `/profile` | Review account and billing state |
| Governance centers | `/spec-center`, `/change-requests`, `/releases`, `/audit` | Trace specs, CRs, releases, and audit events |

See [NAVIGATION_MAP.md](./NAVIGATION_MAP.md) for the full workspace route map.

---

## Export formats

| Format | Fidelity | Typical use | Doc |
|--------|----------|-------------|-----|
| JSON | Full project manifest (round-trip) | Production backup and re-import | — |
| PNG | Raster plan image | Quick sharing and thumbnails | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| SVG | Vector floor plan where enabled | Design review and scaling | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| PDF | Project summary sheet | Client review package | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |
| DXF | CAD exchange entities where enabled | Downstream CAD workflows | [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md) |

JSON is the only format suitable for production backup and re-import.
