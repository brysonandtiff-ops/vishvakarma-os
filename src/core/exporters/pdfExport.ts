import { buildTextPdf } from '@/utils/minimalPdf';
import type { ProjectManifest } from '@/types';
import { summarizeProjectManifest } from '@/core/projectModel';

export function exportManifestToPdfBytes(manifest: ProjectManifest): Uint8Array {
  const summary = summarizeProjectManifest(manifest);
  const lines = [
    `Project: ${manifest.name}`,
    `Walls: ${summary.wallCount}`,
    `Openings: ${summary.openingCount}`,
    `Grid: ${summary.gridSize}px · Snap: ${summary.snapToGrid ? 'on' : 'off'}`,
    '',
    'Room labels:',
    ...(manifest.labels ?? []).map((l) => `  - ${l.text}`),
    '',
    'Dimensions:',
    ...(manifest.dimensions ?? []).map(
      (d) => `  - (${d.start.x},${d.start.y}) → (${d.end.x},${d.end.y})`,
    ),
    '',
    'Material schedule:',
    ...manifest.walls.map((w) => `  - Wall ${w.id}: ${w.material}`),
  ];
  return buildTextPdf(manifest.name, lines);
}

export function downloadPdf(manifest: ProjectManifest): void {
  const bytes = exportManifestToPdfBytes(manifest);
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${manifest.name.replace(/\s+/g, '-').toLowerCase()}-floor-plan.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
