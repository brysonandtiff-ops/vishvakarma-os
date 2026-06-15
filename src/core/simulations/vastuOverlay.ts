import { COMPASS_FILL, COMPASS_STROKE, GOLD_MUTED } from '@/core/sceneDrawingTokens';
import { analyzeVastu, getVastuPlanCentroid, VASTU_DIRECTIONS, type VastuAnalysisResult, type VastuDirection } from '@/core/simulations/vastu';
import type { ProjectManifest } from '@/types';

const vastuAnalysisCache = new Map<string, VastuAnalysisResult>();

function vastuGeometryHash(manifest: Pick<ProjectManifest, 'walls' | 'openings' | 'labels' | 'northOrientation'>): string {
  return JSON.stringify({
    walls: manifest.walls?.map((w) => [w.id, w.start, w.end]),
    openings: manifest.openings?.map((o) => [o.id, o.wallId, o.position, o.type]),
    labels: manifest.labels?.map((l) => [l.id, l.text, l.position]),
    north: manifest.northOrientation ?? 0,
  });
}

export function getCachedVastuAnalysis(
  manifest: Pick<ProjectManifest, 'walls' | 'openings' | 'labels' | 'northOrientation'>,
): VastuAnalysisResult {
  const key = vastuGeometryHash(manifest);
  const cached = vastuAnalysisCache.get(key);
  if (cached) return cached;
  const analysis = analyzeVastu(manifest);
  vastuAnalysisCache.set(key, analysis);
  if (vastuAnalysisCache.size > 24) {
    const first = vastuAnalysisCache.keys().next().value;
    if (first) vastuAnalysisCache.delete(first);
  }
  return analysis;
}

function sectorColor(score: number): string {
  if (score >= 75) return 'rgba(56, 142, 60, 0.18)';
  if (score >= 60) return 'rgba(184, 148, 31, 0.14)';
  return 'rgba(180, 80, 60, 0.14)';
}

/**
 * Draw 8 Vastu sectors on the 2D blueprint canvas (world coordinates).
 */
export function computeVastuOverlayRadius(walls: ProjectManifest['walls']): number {
  if (!walls || walls.length === 0) return 120;
  const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return Math.max(80, Math.max(maxX - minX, maxY - minY) * 0.45);
}

export function drawVastuSectorOverlay(
  ctx: CanvasRenderingContext2D,
  manifest: Pick<ProjectManifest, 'walls' | 'openings' | 'labels' | 'northOrientation'>,
  radius: number,
): void {
  const walls = manifest.walls ?? [];
  if (walls.length === 0) return;

  const center = getVastuPlanCentroid(manifest);
  const northOrientation = manifest.northOrientation ?? 0;
  const analysis = getCachedVastuAnalysis(manifest);
  const scoreByDir = new Map(analysis.directions.map((d) => [d.direction, d.score]));

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(((northOrientation - 90) * Math.PI) / 180);

  for (let i = 0; i < 8; i++) {
    const direction = VASTU_DIRECTIONS[i] as VastuDirection;
    const score = scoreByDir.get(direction) ?? 60;
    const startAngle = (i * Math.PI) / 4 - Math.PI / 2;
    const endAngle = startAngle + Math.PI / 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = sectorColor(score);
    ctx.fill();
    ctx.strokeStyle = COMPASS_STROKE;
    ctx.lineWidth = 1;
    ctx.stroke();

    const midAngle = (startAngle + endAngle) / 2;
    const labelR = radius * 0.72;
    ctx.fillStyle = GOLD_MUTED;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(direction, Math.cos(midAngle) * labelR, Math.sin(midAngle) * labelR);
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = COMPASS_STROKE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COMPASS_FILL;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
