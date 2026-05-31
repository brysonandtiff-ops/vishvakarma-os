# Export Package — Format Limitations

Vishvakarma.OS **Export Package** uses the live `ProjectManifest` from the editor. Formats below are **demo-ready**, not CAD deliverables. Use **JSON** for full round-trip fidelity.

## Summary

| Format | Status | Use for |
|--------|--------|---------|
| **JSON** | Full round-trip | Backup, import, cloud sync, Project Proof |
| **PNG** | Partial raster | Quick share / thumbnail (walls only) |
| **PDF** | Summary sheet | Project name, counts, labels list, material schedule |
| **DXF** | Basic geometry | Simple CAD import (LINE entities only) |

## JSON (recommended)

- **Includes:** Full manifest — walls, openings, labels, dimensions, lighting, grid, materials, metadata.
- **Filename:** `{project-slug}-floor-plan.json` via `buildProjectExportFilename()`.
- **Import:** Supported in-editor; validates through `parseProjectManifestJson` / `ImportModule`.

## PNG

**Implementation:** `src/core/exporters/pngExport.ts` — SVG rasterized to 1200×800 canvas.

| Included | Not included |
|----------|----------------|
| Wall centerlines (scaled stroke) | Doors and windows |
| Cream paper background | Labels and dimension lines |
| | Grid overlay |
| | Room fills or furniture |

**Not suitable for:** Construction documents, client CAD handoff, or dimensioned plans.

## PDF

**Implementation:** `src/core/exporters/pdfExport.ts` — text summary via `minimalPdf`, not a drawing.

**Page content:**

- Project name and export date (title)
- Wall/opening counts, grid size, snap state
- Room label list (text only)
- Dimension coordinate list (text only)
- Per-wall material schedule

**Not suitable for:** Scaled floor plans, title blocks, room schedules with areas, or permit submissions.

## DXF

**Implementation:** `src/core/exporters/dxfExport.ts` — minimal ASCII DXF with `LINE` entities.

| Layer | Content |
|-------|---------|
| `WALLS` | Wall segments |
| `DOORS` / `WINDOWS` | Short LINE markers at opening positions |
| `DIMENSIONS` | Dimension line segments |

**Limitations:**

- No arcs, blocks, polylines, or layers beyond those above
- Opening geometry is symbolic, not standard door/window blocks
- Units are manifest coordinate units (not auto-scaled to mm/feet in file header)
- No title block or metadata fields

**Not suitable for:** AutoCAD production workflows without manual cleanup.

## Tier gating (UI)

In **Export Package** dialog, PDF and DXF buttons are disabled on **Starter** tier in code (`tier === 'starter'`). JSON and PNG remain available. Studio/Enterprise tiers enable all four buttons in the current build.

## Future improvements (not in this release)

- PNG: openings, labels, dimensions on raster
- PDF: vector floor plan page with scale bar
- DXF: proper blocks for doors/windows, unit metadata, room polylines
