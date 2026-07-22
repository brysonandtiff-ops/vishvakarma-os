import type { Point2D, TerrainPatch } from '@/types';
import { canvasToWorld } from '@/core/sceneVisualCatalog';
import { drawPatternOverlay2D } from '@/core/texturePatterns';

export const TERRAIN_ELEVATION_PRESETS = [0, 30, 60, 90, 120] as const;

export const TERRAIN_CLOSE_THRESHOLD_PX = 12;
export const TERRAIN_MIN_AREA_PX2 = 400;

export function formatTerrainElevation(cm: number): string {
  if (cm === 0) return 'Grade';
  if (cm % 100 === 0) return `${cm / 100} m`;
  if (cm >= 100) return `${(cm / 100).toFixed(1)} m`;
  return `${cm} cm`;
}

export function getPolygonCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2);
}

export function isValidTerrainPolygon(points: Point2D[]): boolean {
  return points.length >= 3 && polygonArea(points) >= TERRAIN_MIN_AREA_PX2;
}

export function pointsNear(a: Point2D, b: Point2D, threshold = TERRAIN_CLOSE_THRESHOLD_PX): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= threshold;
}

export function getTerrainElevationPreset(index: number): number {
  return TERRAIN_ELEVATION_PRESETS[index % TERRAIN_ELEVATION_PRESETS.length];
}

export function buildTerrainShapePoints(patch: TerrainPatch): { x: number; z: number }[] {
  return patch.points.map((point) => {
    const world = canvasToWorld(point);
    return { x: world.x, z: world.z };
  });
}

function drawPolygonPath(ctx: CanvasRenderingContext2D, points: Point2D[]) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

export function drawTerrain2D(
  ctx: CanvasRenderingContext2D,
  patch: TerrainPatch,
  options?: { preview?: boolean; ghostPoints?: Point2D[] },
) {
  const points = options?.ghostPoints ?? patch.points;
  if (points.length < 2) return;

  ctx.save();
  drawPolygonPath(ctx, points);

  if (options?.preview) {
    ctx.fillStyle = 'rgba(56, 142, 60, 0.18)';
    ctx.strokeStyle = 'rgba(46, 125, 50, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = 'rgba(56, 142, 60, 0.35)';
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    const bounds = points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxX: Math.max(acc.maxX, point.x),
        maxY: Math.max(acc.maxY, point.y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    drawPatternOverlay2D(
      ctx,
      'grass',
      bounds.minX,
      bounds.minY,
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
      0.32,
    );

    const centroid = getPolygonCentroid(points);
    ctx.fillStyle = '#1b5e20';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTerrainElevation(patch.elevation), centroid.x, centroid.y);
  }

  ctx.restore();
}

export function drawTerrainPreview(
  ctx: CanvasRenderingContext2D,
  vertices: Point2D[],
  cursor: Point2D,
  elevation: number,
) {
  if (vertices.length === 0) return;

  const ghostPoints = [...vertices, cursor];
  if (ghostPoints.length >= 3) {
    drawTerrain2D(
      ctx,
      { id: 'preview', points: ghostPoints, elevation },
      { preview: true, ghostPoints },
    );
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(46, 125, 50, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(vertices[vertices.length - 1].x, vertices[vertices.length - 1].y);
  ctx.lineTo(cursor.x, cursor.y);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const [index, point] of vertices.entries()) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = index === 0 ? 'rgba(27, 94, 32, 0.9)' : 'rgba(56, 142, 60, 0.75)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}
