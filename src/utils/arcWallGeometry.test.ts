import { describe, expect, it } from 'vitest';
import { createArcWallSegments, sampleArcWall } from './arcWallGeometry';
import { MIN_WALL_LENGTH_PX } from './wallDrawConstraints';

const start = { x: 0, y: 0 };
const end = { x: 200, y: 0 };
const bend = { x: 100, y: 55 };

describe('Arc Wall geometry', () => {
  it('starts and ends exactly at the taps and passes through the bend tap', () => {
    const points = sampleArcWall(start, end, bend);
    expect(points.length).toBeGreaterThan(2);
    expect(points[0]).toEqual(start);
    expect(points[points.length - 1]).toEqual(end);
    expect(points[Math.floor(points.length / 2)]).toEqual(bend);
  });

  it('curves to either side of the endpoints', () => {
    expect(sampleArcWall(start, end, { x: 100, y: -45 }).some((p) => p.y < -30)).toBe(true);
  });

  it('produces connected, valid standard wall segments with bounded count', () => {
    const walls = createArcWallSegments(start, end, bend, 'arc-test', {
      thickness: 10, height: 240, material: 'material-paint',
    });
    expect(walls.length).toBeGreaterThan(2);
    expect(walls.length).toBeLessThanOrEqual(48);
    expect(new Set(walls.map((wall) => wall.id)).size).toBe(walls.length);
    for (let i = 0; i < walls.length; i += 1) {
      const wall = walls[i]!;
      expect(Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y))
        .toBeGreaterThanOrEqual(MIN_WALL_LENGTH_PX);
      if (i > 0) expect(wall.start).toEqual(walls[i - 1]!.end);
    }
  });

  it('rejects nearly straight and too-short input', () => {
    expect(sampleArcWall(start, end, { x: 100, y: 0 })).toEqual([]);
    expect(sampleArcWall(start, end, { x: 100, y: 4 })).toEqual([]);
    expect(sampleArcWall(start, start, bend)).toEqual([]);
  });

  it('rejects invalid points', () => {
    expect(sampleArcWall(start, end, { x: Infinity, y: 55 })).toEqual([]);
    expect(sampleArcWall({ x: NaN, y: 0 }, end, bend)).toEqual([]);
  });

  it('caps the wall count for large curves', () => {
    expect(sampleArcWall(start, { x: 3000, y: 0 }, { x: 1500, y: 500 }).length).toBe(49);
  });
});
