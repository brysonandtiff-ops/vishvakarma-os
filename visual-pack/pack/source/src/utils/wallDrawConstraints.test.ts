import { describe, expect, it } from 'vitest';
import {
  constrainToOrthogonal,
  enforceMinWallLength,
  getWallEndpointAtPoint,
  MIN_WALL_LENGTH_PX,
} from './wallDrawConstraints';

describe('wallDrawConstraints', () => {
  const origin = { x: 100, y: 100 };

  it('snaps to horizontal when dx dominates', () => {
    const result = constrainToOrthogonal(origin, { x: 200, y: 130 });
    expect(result).toEqual({ x: 200, y: 100 });
  });

  it('snaps to vertical when dy dominates', () => {
    const result = constrainToOrthogonal(origin, { x: 120, y: 220 });
    expect(result).toEqual({ x: 100, y: 220 });
  });

  it('leaves 45° diagonal unchanged when not constrained', () => {
    const point = { x: 140, y: 140 };
    expect(point).toEqual({ x: 140, y: 140 });
  });

  it('enforces minimum wall length from fixed endpoint', () => {
    const fixed = { x: 0, y: 0 };
    const tooClose = enforceMinWallLength(fixed, { x: 2, y: 0 });
    expect(tooClose.x).toBe(MIN_WALL_LENGTH_PX);
    expect(tooClose.y).toBe(0);
  });

  it('does not invert wall when dragging endpoint too close', () => {
    const fixed = { x: 50, y: 50 };
    const moving = { x: 50, y: 50 };
    const result = enforceMinWallLength(fixed, moving);
    const len = Math.hypot(result.x - fixed.x, result.y - fixed.y);
    expect(len).toBeGreaterThanOrEqual(MIN_WALL_LENGTH_PX);
  });

  it('hit-tests wall endpoints', () => {
    const wall = { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } };
    expect(getWallEndpointAtPoint({ x: 3, y: 2 }, wall, 10)).toBe('start');
    expect(getWallEndpointAtPoint({ x: 97, y: 1 }, wall, 10)).toBe('end');
    expect(getWallEndpointAtPoint({ x: 50, y: 50 }, wall, 10)).toBeNull();
  });
});
