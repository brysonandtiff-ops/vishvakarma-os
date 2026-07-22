import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import { analyzePanchatattva } from '@/core/simulations/panchatattva';
import { analyzeVastu } from '@/core/simulations/vastu';
import {
  resolveJurisdiction,
  resolveRegionId,
  complianceCodeLabel,
} from '@/domain/projects/jurisdiction';
import { getRegionById } from '@/services/cost-estimation/regionalCostIndex';
import { formatCurrency } from '@/utils/currencyFormat';
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
  ctx.fillStyle = '#f5f1e8'; // CANVAS_PAPER_FILL
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Germania-Veda: Procedurally inject the 'Wiesenburg Crest' watermark
  const watermarkSvg = `
    <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.15"/>
      <path d="M30 40 L50 70 L70 40" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.15"/>
      <path d="M50 20 L50 65" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.15"/>
      <text x="50" y="85" font-family="serif" font-size="8" text-anchor="middle" fill="#D4AF37" opacity="0.15" letter-spacing="1">WIESENBURG</text>
    </svg>
  `;
  const watermarkImg = new Image();
  await new Promise<void>((resolve) => {
    watermarkImg.onload = () => resolve();
    watermarkImg.src = 'data:image/svg+xml;base64,' + btoa(watermarkSvg);
  });
  
  // Draw the blueprint
  ctx.drawImage(img, 0, 0);
  
  // Overlay the laser-etched watermark in the bottom right corner
  ctx.drawImage(watermarkImg, canvas.width - 250, canvas.height - 250, 200, 200);

  URL.revokeObjectURL(url);

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))), 'image/jpeg', 0.92);
  });

  return new Uint8Array(await jpegBlob.arrayBuffer());
}

export function exportManifestToPdfBytes(manifest: ProjectManifest): Uint8Array {
  const summary = summarizeProjectManifest(manifest);
  const jurisdiction = resolveJurisdiction(manifest);
  const codeLabel = complianceCodeLabel(jurisdiction);
  const region = getRegionById(resolveRegionId(manifest));
  const vastu = analyzeVastu(manifest);
  const pancha = analyzePanchatattva(manifest);
  const costLine =
    manifest.metadata.costIntelligence?.expected != null
      ? `Cost band: ${formatCurrency(manifest.metadata.costIntelligence.expected, region.currency)} (${region.label})`
      : null;

  const lines = [
    `Project: ${manifest.name}`,
    `Locale: ${jurisdiction === 'in' ? 'India' : 'Australia'} · ${codeLabel} pre-check · ${region.label}`,
    `Walls: ${summary.wallCount}`,
    `Openings: ${summary.openingCount}`,
    `Grid: ${summary.gridSize}px · Snap: ${summary.snapToGrid ? 'on' : 'off'}`,
    '',
    'Vastu Harmony (decision-support):',
    `  Harmony: ${vastu.harmonyPercent}% · Entrance ${vastu.entranceScore} · Kitchen ${vastu.kitchenScore}`,
    ...vastu.tips.slice(0, 3).map((t) => `  - ${t}`),
    '',
    'Panchatattva balance:',
    `  Overall: ${pancha.balancePercent}%`,
    ...pancha.elements.map((e) => `  - ${e.label}: ${e.score}`),
    '',
    ...(costLine ? [costLine, ''] : []),
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
