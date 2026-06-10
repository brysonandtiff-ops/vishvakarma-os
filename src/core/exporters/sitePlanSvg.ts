import type { SitePlan } from '@/domain/buildings/generatedBuilding';

export function buildSitePlanSvg(sitePlan: SitePlan, title = 'Site Plan'): string {
  const points = sitePlan.parcelBoundary;
  const footprint = sitePlan.buildingFootprint;
  if (points.length < 3) return '';

  const all = [...points, ...footprint];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxX = Math.max(...all.map((p) => p.x));
  const maxY = Math.max(...all.map((p) => p.y));
  const pad = 40;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX + pad} ${p.y - minY + pad}`).join(' ') + ' Z';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#f5f1e8"/>
  <text x="${pad}" y="24" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#333">${title}</text>
  <text x="${pad}" y="42" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#666">${sitePlan.orientation} · setbacks F${sitePlan.setbacks.front}m S${sitePlan.setbacks.side}m R${sitePlan.setbacks.rear}m</text>
  <path d="${toPath(points)}" fill="none" stroke="#8B6914" stroke-width="2"/>
  <path d="${toPath(footprint)}" fill="#8B6914" fill-opacity="0.15" stroke="#333" stroke-width="1.5"/>
</svg>`;
}

async function svgToJpegBytes(svg: string): Promise<Uint8Array> {
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
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))), 'image/jpeg', 0.92);
  });

  return new Uint8Array(await jpegBlob.arrayBuffer());
}

export async function exportSitePlanToVisualPdfBytes(
  sitePlan: SitePlan,
  projectName: string,
): Promise<Uint8Array> {
  const { buildVisualPdf } = await import('@/utils/minimalPdf');
  const svg = buildSitePlanSvg(sitePlan, `${projectName} — Site Plan`);
  const jpeg = await svgToJpegBytes(svg);
  const date = new Date().toISOString().slice(0, 10);
  return buildVisualPdf(projectName, `Site plan · ${date} · Vishvakarma.OS`, jpeg);
}
