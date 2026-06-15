# RFC 008 — Sheet Set Export

## Status

**Accepted (v1 scaffold)** — composer API + page descriptors; PDF multi-page deferred.

## Problem

Architects deliver **sheet sets** (plan, elevations, sections, title block). v1.5 exports single SVG/PDF/JSON — not a coordinated set.

## Proposal

1. **`SheetSetComposer`** — builds ordered `SheetPage[]` from manifest
2. **Default sheets** — A1 title, floor plan (active floor), stub elevation slot
3. **PDF path** — multi-page jsPDF composer (Horizon 1)
4. **Auto-elevation** — generate south elevation from wall heights (Horizon 1)

## v1 scaffold (shipped target)

- `composeSheetSet(manifest, options)` → `{ pages, warnings, disclaimer }`
- Vitest coverage with sample manifest
- Gate 17 when wired

## Non-goals (v1 scaffold)

- Title block customization UI
- DWG sheet export
- Plot scale registry

## References

- `src/modules/sheetSet/`
- `src/modules/export.ts`
