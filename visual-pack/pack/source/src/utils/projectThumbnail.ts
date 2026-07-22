import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import type { ProjectManifest } from '@/types';

export function projectThumbnailDataUrl(manifest: ProjectManifest): string | null {
  if (manifest.walls.length === 0 && manifest.openings.length === 0) {
    return null;
  }
  try {
    const svg = buildFloorPlanSvg(manifest);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return null;
  }
}
