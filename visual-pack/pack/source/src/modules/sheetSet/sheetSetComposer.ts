import type { ProjectManifest } from '@/types';

export type SheetKind = 'title' | 'plan' | 'elevation' | 'section' | 'detail';

export interface SheetPage {
  id: string;
  kind: SheetKind;
  title: string;
  sheetNumber: string;
  floorIndex?: number;
  orientation: 'landscape' | 'portrait';
  /** Future: canvas viewport or SVG fragment reference. */
  renderHint: string;
}

export interface SheetSetComposition {
  projectName: string;
  pages: SheetPage[];
  warnings: string[];
  disclaimer: string;
}

export interface SheetSetComposeOptions {
  includeTitle?: boolean;
  includeElevationStub?: boolean;
  activeFloorIndex?: number;
}

const SHEET_SET_DISCLAIMER =
  'Sheet set preview — not for construction. Verify dimensions and title block before issue.';

export function composeSheetSet(
  manifest: ProjectManifest,
  options: SheetSetComposeOptions = {},
): SheetSetComposition {
  const warnings: string[] = [];
  const pages: SheetPage[] = [];
  const floorIndex = options.activeFloorIndex ?? manifest.activeFloorIndex ?? 0;
  const wallsOnFloor = manifest.walls.filter(
    (wall) => (wall.floorIndex ?? manifest.activeFloorIndex ?? 0) === floorIndex,
  );

  if (options.includeTitle !== false) {
    pages.push({
      id: 'sheet-title',
      kind: 'title',
      title: manifest.name,
      sheetNumber: 'A-001',
      orientation: 'landscape',
      renderHint: 'title-block-v0',
    });
  }

  pages.push({
    id: `sheet-plan-${floorIndex}`,
    kind: 'plan',
    title: `Floor Plan — Level ${floorIndex}`,
    sheetNumber: 'A-101',
    floorIndex,
    orientation: 'landscape',
    renderHint: 'manifest-floor-plan',
  });

  if (wallsOnFloor.length === 0) {
    warnings.push(`No walls on floor ${floorIndex} — plan sheet will be empty.`);
  }

  if (options.includeElevationStub !== false) {
    pages.push({
      id: 'sheet-elevation-south',
      kind: 'elevation',
      title: 'South Elevation (auto-stub)',
      sheetNumber: 'A-201',
      orientation: 'landscape',
      renderHint: 'elevation-auto-v0',
    });
    warnings.push('Elevation sheet is a composer stub — auto-generation lands in Horizon 1.');
  }

  return {
    projectName: manifest.name,
    pages,
    warnings,
    disclaimer: SHEET_SET_DISCLAIMER,
  };
}
