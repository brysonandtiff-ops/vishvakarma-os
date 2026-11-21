import type { Point2D, Wall } from '@/types';
import { MIN_WALL_LENGTH_PX } from '@/utils/wallDrawConstraints';

/**
 * Three taps: start, end, and a point the curve passes through midway.
 * Store compatible straight walls until native arc rendering, openings and
 * editing/export contracts are verified across the entire project.
 */
export function sampleArcWall(start: Point2D, end: Point2D, through: Point2D): Point2D[] {
  const coordinates = [start.x, start.y, end.x, end.y, through.x, through.y];
  if (!coordinates.every(Number.isFinite)) return [];

  const chord = Math.hypot(end.x - start.x, end.y - start.y);
  if (chord < MIN_WALL_LENGTH_PX * 3) return [];
  const deviation = Math.abs(
    (end.x - start.x) * (through.y - start.y) -
    (end.y - start.y) * (through.x - start.x)
  ) / chord;
  if (deviation < 8) return [];

  const control = {
    x: 2 * through.x - (start.x + end.x) / 2,
    y: 2 * through.y - (start.y + end.y) / 2,
  };
  const pointAt = (t: number): Point2D => {
    const u = 1 - t;
    return {
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
    };
  };

  let approxLength = 0;
  let previous = start;
  for (let i = 1; i <= 32; i += 1) {
    const next = pointAt(i / 32);
    approxLength += Math.hypot(next.x - previous.x, next.y - previous.y);
    previous = next;
  }

  let count = Math.min(48, Math.max(2, Math.ceil(approxLength / 28)));
  if (count % 2 !== 0) count += 1;
  for (; count >= 2; count -= 2) {
    const points = Array.from({ length: count + 1 }, (_, i) => pointAt(i / count));
    if (points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
      points.slice(1).every((point, index) =>
        Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y) >= MIN_WALL_LENGTH_PX
      )) {
      points[0] = start;
      points[points.length - 1] = end;
      return points;
    }
  }
  return [];
}

export function createArcWallSegments(
  start: Point2D,
  end: Point2D,
  through: Point2D,
  idPrefix: string,
  defaults: Pick<Wall, 'thickness' | 'height' | 'material'>,
): Wall[] {
  const points = sampleArcWall(start, end, through);
  return points.slice(1).map((point, index) => ({
    id: idPrefix + '-' + index,
    start: points[index]!,
    end: point,
    ...defaults,
  }));
}
