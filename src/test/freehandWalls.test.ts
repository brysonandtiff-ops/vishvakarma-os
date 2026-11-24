import { describe, expect, it } from 'vitest';
import {
  appendPencilPoint,
  MAX_PENCIL_POINTS,
  MAX_PENCIL_WALLS,
  pencilStrokeToWalls,
  simplifyPencilPoints,
} from '@/components/editor/blueprint/freehandWalls';

describe('finger and stylus pencil wall strokes', () => {
  it('does not create walls from taps, invalid coordinates or tiny accidental strokes', () => {
    expect(pencilStrokeToWalls([{ x: 0, y: 0 }], 'tap')).toEqual([]);
    expect(pencilStrokeToWalls([{ x: 0, y: 0 }, { x: 3, y: 2 }], 'tiny')).toEqual([]);
    const empty: { x: number; y: number }[] = [];
    expect(appendPencilPoint(empty, { x: Number.NaN, y: 5 })).toBe(empty);
    expect(appendPencilPoint(empty, { x: 0, y: 0 })).toHaveLength(1);
  });

  it('turns a finger or Apple Pencil straight gesture into one editable wall', () => {
    const points = [
      { x: 10, y: 20 },
      { x: 15, y: 20 },
      { x: 35, y: 20.5 },
      { x: 100, y: 20 },
    ];
    const walls = pencilStrokeToWalls(points, 'finger');
    expect(walls).toHaveLength(1);
    expect(walls[0]).toMatchObject({
      id: 'wall-pen-finger-0',
      start: { x: 10, y: 20 },
      end: { x: 100, y: 20 },
      thickness: 10,
      height: 240,
    });
  });

  it('preserves house corners, connects walls, and assigns unique stroke ids', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 100 },
    ];
    const walls = pencilStrokeToWalls(points, 'apple-pencil');
    expect(walls).toHaveLength(2);
    expect(walls[0]!.end).toEqual(walls[1]!.start);
    expect(new Set(walls.map((wall) => wall.id)).size).toBe(walls.length);
  });

  it('samples pen movement but limits geometry on mobile devices', () => {
    let points: { x: number; y: number }[] = [];
    for (let index = 0; index < MAX_PENCIL_POINTS + 25; index += 1) {
      points = appendPencilPoint(points, { x: index * 6, y: index % 2 ? 22 : 0 });
    }
    expect(points.length).toBeLessThanOrEqual(MAX_PENCIL_POINTS);
    const extended = appendPencilPoint(points, { x: 99999, y: 0 });
    expect(extended.length).toBeLessThanOrEqual(MAX_PENCIL_POINTS);
    expect(extended[extended.length - 1]).toEqual({ x: 99999, y: 0 });
    expect(simplifyPencilPoints(points).length).toBeLessThanOrEqual(MAX_PENCIL_WALLS + 1);
    expect(pencilStrokeToWalls(points, 'bounded').length).toBeLessThanOrEqual(MAX_PENCIL_WALLS);
  });

  it('drops duplicate samples without changing prior paths', () => {
    const first = appendPencilPoint([], { x: 1, y: 1 });
    expect(appendPencilPoint(first, { x: 2, y: 2 })).toBe(first);
    expect(first).toEqual([{ x: 1, y: 1 }]);
  });
});
