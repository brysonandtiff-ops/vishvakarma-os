import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import { buildTextPdf, buildVisualPdf } from '@/utils/minimalPdf';
import type { ProjectManifest } from '@/types';
import { summarizeProjectManifest } from '@/core/projectModel';

async function rasterizeManifestToJpeg(manifest: ProjectManifest): Promise<Uint8Array> {
  const svg = buildFloorPlanSvg(manifest);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.fillStyle = '#f5f1e8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))), 'image/jpeg', 0.92);
  });

  return new Uint8Array(await jpegBlob.arrayBuffer());
}

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

export async function exportManifestToVisualPdfBytes(
  manifest: ProjectManifest,
  pageSize: 'a4' | 'letter' = 'a4',
): Promise<Uint8Array> {
  const jpeg = await rasterizeManifestToJpeg(manifest);
  const date = new Date().toISOString().slice(0, 10);
  return buildVisualPdf(manifest.name, `Exported ${date} · Vishvakarma.OS`, jpeg, pageSize);
}

export async function downloadPdf(manifest: ProjectManifest, visual = true): Promise<void> {
  const bytes = visual
    ? await exportManifestToVisualPdfBytes(manifest)
    : exportManifestToPdfBytes(manifest);
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${manifest.name.replace(/\s+/g, '-').toLowerCase()}-floor-plan.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
