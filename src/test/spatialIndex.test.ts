import { describe, expect, it } from 'vitest';
import { SpatialIndex } from '@/editor/spatialIndex';
import type { Wall } from '@/types';

const walls: Wall[] = [
  {
    id: 'w1',
    start: { x: 0, y: 0 },
    end: { x: 200, y: 0 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
  {
    id: 'w2',
    start: { x: 200, y: 0 },
    end: { x: 200, y: 150 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
];

describe('SpatialIndex', () => {
  it('finds a wall near a point without scanning every wall manually', () => {
    const index = new SpatialIndex();
    index.rebuild({ walls, openings: [], furniture: [], fixtures: [] });
    const hit = index.findWallAtPoint({ x: 100, y: 2 }, 8);
    expect(hit?.id).toBe('w1');
  });

  it('returns walls in a selection rect', () => {
    const index = new SpatialIndex();
    index.rebuild({ walls, openings: [], furniture: [], fixtures: [] });
    const ids = index.wallsInRect(-10, -10, 210, 160);
    expect(ids).toContain('w1');
    expect(ids).toContain('w2');
  });
});
