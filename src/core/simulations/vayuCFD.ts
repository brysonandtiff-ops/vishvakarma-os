import type { Point2D, Wall } from '@/types';

export interface CfdVector {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface CfdFieldResult {
  vectors: CfdVector[];
  avgVelocity: number;
  crossVentScore: number;
}

export function computeVayuField(
  walls: Wall[],
  windDirectionDeg = 0,
  cols = 12,
  rows = 8,
  bounds = { minX: 0, minY: 0, maxX: 800, maxY: 600 },
): CfdFieldResult {
  const vectors: CfdVector[] = [];
  const rad = (windDirectionDeg * Math.PI) / 180;
  const baseVx = Math.cos(rad) * 2;
  const baseVy = Math.sin(rad) * 2;
  const stepX = (bounds.maxX - bounds.minX) / cols;
  const stepY = (bounds.maxY - bounds.minY) / rows;

  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const x = bounds.minX + i * stepX;
      const y = bounds.minY + j * stepY;
      const blocked = walls.some((w) => {
        const minX = Math.min(w.start.x, w.end.x) - 20;
        const maxX = Math.max(w.start.x, w.end.x) + 20;
        const minY = Math.min(w.start.y, w.end.y) - 20;
        const maxY = Math.max(w.start.y, w.end.y) + 20;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      });
      vectors.push({
        x,
        y,
        vx: blocked ? baseVx * 0.15 : baseVx,
        vy: blocked ? baseVy * 0.15 : baseVy,
      });
    }
  }

  const avgVelocity =
    vectors.reduce((s, v) => s + Math.hypot(v.vx, v.vy), 0) / Math.max(vectors.length, 1);
  const crossVentScore = Math.min(100, Math.round(avgVelocity * 28));

  return { vectors, avgVelocity, crossVentScore };
}

export function sampleParticlePosition(field: CfdFieldResult, t: number): Point2D {
  const idx = Math.floor(t % field.vectors.length);
  const v = field.vectors[idx];
  return { x: v.x + v.vx * (t % 1) * 8, y: v.y + v.vy * (t % 1) * 8 };
}
