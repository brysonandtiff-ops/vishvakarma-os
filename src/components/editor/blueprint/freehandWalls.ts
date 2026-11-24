/**
 * Convert one finger/Pencil/USB stylus gesture into a small, editable chain of walls.
 * This preserves existing project save/load, 3D generation, and undo history.
 * Samples are world coordinates; do not interpret pressure as wall thickness.
 */
import type { Point2D, Wall } from '@/types';
import { MIN_WALL_LENGTH_PX } from '@/utils/wallDrawConstraints';

export const MAX_PENCIL_POINTS = 2048;
export const MAX_PENCIL_WALLS = 96;

const distance = (a: Point2D, b: Point2D) => Math.hypot(a.x - b.x, a.y - b.y);

export function appendPencilPoint(points: Point2D[], point: Point2D): Point2D[] {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return points;
  const last = points[points.length - 1];
  if (last && distance(last, point) < 3) return points;
  // Keep the pencil responsive during arbitrarily long strokes instead of
  // silently truncating the stroke when the sample budget is reached.
  if (points.length >= MAX_PENCIL_POINTS) {
    return [...points.filter((_, index) => index % 2 === 0), point];
  }
  return [...points, point];
}

function segmentDistance(point: Point2D, start: Point2D, end: Point2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, start);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return distance(point, { x: start.x + dx * t, y: start.y + dy * t });
}

/** Iterative line simplification avoids excessive React/3D work on long strokes. */
export function simplifyPencilPoints(points: Point2D[], tolerance = 5): Point2D[] {
  if (points.length <= 2) return points.slice();
  const keep = new Set<number>([0, points.length - 1]);
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [startIndex, endIndex] = stack.pop()!;
    let bestDistance = tolerance;
    let bestIndex = -1;
    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const d = segmentDistance(points[i]!, points[startIndex]!, points[endIndex]!);
      if (d > bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) {
      keep.add(bestIndex);
      stack.push([startIndex, bestIndex], [bestIndex, endIndex]);
    }
  }
  const simplified = [...keep].sort((a, b) => a - b).map((index) => points[index]!);
  if (simplified.length <= MAX_PENCIL_WALLS + 1) return simplified;

  // A bounded amount of geometry protects the editor/3D scene on mobile devices.
  return Array.from({ length: MAX_PENCIL_WALLS + 1 }, (_, index) =>
    simplified[Math.round(index * (simplified.length - 1) / MAX_PENCIL_WALLS)]!,
  );
}

export function pencilStrokeToWalls(points: Point2D[], strokeId: string): Wall[] {
  const simplified = simplifyPencilPoints(points);
  if (!simplified.length) return [];
  const vertices: Point2D[] = [simplified[0]!];
  for (const candidate of simplified.slice(1)) {
    if (distance(vertices[vertices.length - 1]!, candidate) >= MIN_WALL_LENGTH_PX) {
      vertices.push(candidate);
    }
  }

  return vertices.slice(1).map((end, index) => ({
    id: `wall-pen-${strokeId}-${index}`,
    start: vertices[index]!,
    end,
    thickness: 10,
    height: 240,
    material: 'material-paint',
  }));
}
