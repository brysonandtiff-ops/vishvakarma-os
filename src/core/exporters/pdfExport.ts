import { buildTextPdf, buildVisualPdf } from '@/utils/minimalPdf';
import type { ProjectManifest } from '@/types';
import { summarizeProjectManifest } from '@/core/projectModel';

function buildFloorPlanSvg(manifest: ProjectManifest): string {
  const walls = manifest.walls
    .map(
      (w) =>
        `<line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#2c1810" stroke-width="${Math.max(w.thickness, 4)}" stroke-linecap="square" />`,
    )
    .join('');

  const labels = (manifest.labels ?? [])
    .map(
      (l) =>
        `<text x="${l.position.x}" y="${l.position.y}" fill="${l.color ?? '#2c1810'}" font-size="${l.fontSize ?? 14}" font-family="sans-serif">${l.text}</text>`,
    )
    .join('');

  const dimensions = (manifest.dimensions ?? [])
    .map((d) => {
      const length = Math.hypot(d.end.x - d.start.x, d.end.y - d.start.y);
      const midX = (d.start.x + d.end.x) / 2;
      const midY = (d.start.y + d.end.y) / 2;
      return `<line x1="${d.start.x}" y1="${d.start.y}" x2="${d.end.x}" y2="${d.end.y}" stroke="#B8941F" stroke-width="2" /><text x="${midX}" y="${midY - 6}" fill="#2c1810" font-size="11" text-anchor="middle">${Math.round(length)}px</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="100%" height="100%" fill="#f5f1e8"/>${walls}${dimensions}${labels}</svg>`;
}

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
