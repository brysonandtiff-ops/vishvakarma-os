import { describe, expect, it } from 'vitest';
import type { Wall } from '@/types';
import {
  isWallSelected,
  normalizeSelectionRect,
  resolveSelectedWallIds,
  toggleWallInSelection,
  wallsInSelectionRect,
} from '@/editor/canvasSelection';

const walls: Wall[] = [
  {
    id: 'w1',
    start: { x: 100, y: 100 },
    end: { x: 200, y: 100 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
  {
    id: 'w2',
    start: { x: 200, y: 100 },
    end: { x: 200, y: 220 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
  {
    id: 'w3',
    start: { x: 400, y: 400 },
    end: { x: 500, y: 400 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
];

describe('canvasSelection', () => {
  it('normalizes marquee rectangles regardless of drag direction', () => {
    const rect = normalizeSelectionRect({ x1: 220, y1: 180, x2: 80, y2: 60 });
    expect(rect.left).toBe(80);
    expect(rect.top).toBe(60);
    expect(rect.width).toBe(140);
    expect(rect.height).toBe(120);
  });

  it('selects walls intersecting a marquee', () => {
    const ids = wallsInSelectionRect(walls, { x1: 50, y1: 50, x2: 250, y2: 250 });
    expect(ids.sort()).toEqual(['w1', 'w2']);
  });

  it('ignores tiny marquee drags', () => {
    expect(wallsInSelectionRect(walls, { x1: 10, y1: 10, x2: 12, y2: 11 })).toEqual([]);
  });

  it('toggles wall ids when additive selection is enabled', () => {
    expect(toggleWallInSelection(['w1'], 'w2', true)).toEqual(['w1', 'w2']);
    expect(toggleWallInSelection(['w1', 'w2'], 'w2', true)).toEqual(['w1']);
    expect(toggleWallInSelection(['w1'], 'w2', false)).toEqual(['w2']);
  });

  it('resolves selected wall ids from session fields', () => {
    expect(resolveSelectedWallIds('w1', ['w1', 'w2'])).toEqual(['w1', 'w2']);
    expect(resolveSelectedWallIds('w1')).toEqual(['w1']);
    expect(isWallSelected('w2', 'w1', ['w1', 'w2'])).toBe(true);
  });
});
