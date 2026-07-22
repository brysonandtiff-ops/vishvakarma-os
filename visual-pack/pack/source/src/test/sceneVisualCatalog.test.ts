import { describe, expect, it } from 'vitest';
import type { FurnitureItem, LandscapeElement } from '@/types';
import {
  drawFurniture2D,
  drawLandscape2D,
  FURNITURE_PRESETS,
  getFurnitureDefaults,
  getLandscapeDefaults,
  hashIdToRotation,
  LANDSCAPE_TYPES,
} from '@/core/sceneVisualCatalog';
import { GOLD, INK, MEP_COLORS } from '@/core/sceneDrawingTokens';

function createMockContext(): CanvasRenderingContext2D {
  const noop = () => undefined;
  return {
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    strokeText: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    arc: noop,
    ellipse: noop,
    fill: noop,
    stroke: noop,
    setLineDash: noop,
    measureText: () => ({ width: 10 }),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
  } as unknown as CanvasRenderingContext2D;
}

describe('sceneVisualCatalog', () => {
  it('defines fifteen furniture presets including Indian residential types', () => {
    expect(FURNITURE_PRESETS).toHaveLength(15);
    expect(FURNITURE_PRESETS.some((p) => p.type === 'mandir')).toBe(true);
    for (const preset of FURNITURE_PRESETS) {
      const defaults = getFurnitureDefaults(preset.type);
      expect(defaults.width).toBeGreaterThan(0);
      expect(defaults.depth).toBeGreaterThan(0);
      expect(defaults.label.length).toBeGreaterThan(0);
    }
  });

  it('defines ten landscape types including Indian garden symbols', () => {
    expect(LANDSCAPE_TYPES).toHaveLength(10);
    expect(LANDSCAPE_TYPES).toContain('water');
    expect(LANDSCAPE_TYPES).toContain('tulsi');
    expect(LANDSCAPE_TYPES).toContain('tree');
    expect(LANDSCAPE_TYPES).toContain('shrub');
    expect(LANDSCAPE_TYPES).toContain('path');
  });

  it('draws every furniture and landscape type without throwing', () => {
    const ctx = createMockContext();
    for (const preset of FURNITURE_PRESETS) {
      const item: FurnitureItem = {
        id: `f-${preset.type}`,
        type: preset.type,
        position: { x: 100, y: 100 },
        width: preset.width,
        depth: preset.depth,
      };
      expect(() => drawFurniture2D(ctx, item, item.position)).not.toThrow();
    }

    for (const type of LANDSCAPE_TYPES) {
      const defaults = getLandscapeDefaults(type);
      const element: LandscapeElement = {
        id: `ls-${type}`,
        type,
        position: { x: 200, y: 200 },
        width: defaults.width,
        depth: defaults.depth,
      };
      expect(() => drawLandscape2D(ctx, element)).not.toThrow();
    }
  });

  it('produces deterministic rock rotation from element id', () => {
    const a = hashIdToRotation('ls-rock-1');
    const b = hashIdToRotation('ls-rock-1');
    const c = hashIdToRotation('ls-rock-2');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('keeps BRAND_LOCK-aligned drawing tokens for ink, gold, and MEP palette', () => {
    expect(GOLD).toBe('#B8941F');
    expect(INK).toBe('#2C2C2C');
    expect(MEP_COLORS.outlet).toBe('#8B6914');
    expect(MEP_COLORS.switch).toBe('#B8941F');
    expect(MEP_COLORS.hvac).toBe('#6B5B4A');
    expect(MEP_COLORS.panel).toBe('#5C4B2A');
  });
});
