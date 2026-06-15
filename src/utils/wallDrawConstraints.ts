import type { Point2D } from '@/types';

export const MIN_WALL_LENGTH_PX = 10;

/** Snap cursor to horizontal or vertical axis from origin (0° / 90°). */
export function constrainToOrthogonal(origin: Point2D, point: Point2D): Point2D {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: point.x, y: origin.y };
  }
  return { x: origin.x, y: point.y };
}

/** Keep moving endpoint at least minLength away from the fixed endpoint. */
export function enforceMinWallLength(
  fixed: Point2D,
  moving: Point2D,
  minLength = MIN_WALL_LENGTH_PX,
): Point2D {
  const dx = moving.x - fixed.x;
  const dy = moving.y - fixed.y;
  const len = Math.hypot(dx, dy);
  if (len >= minLength) return moving;
  if (len === 0) return { x: fixed.x + minLength, y: fixed.y };
  const scale = minLength / len;
  return { x: fixed.x + dx * scale, y: fixed.y + dy * scale };
}

export function getWallEndpointAtPoint(
  point: Point2D,
  wall: { start: Point2D; end: Point2D },
  hitRadius = 10,
): 'start' | 'end' | null {
  const startDist = Math.hypot(point.x - wall.start.x, point.y - wall.start.y);
  const endDist = Math.hypot(point.x - wall.end.x, point.y - wall.end.y);
  if (startDist <= hitRadius && startDist <= endDist) return 'start';
  if (endDist <= hitRadius) return 'end';
  return null;
}
