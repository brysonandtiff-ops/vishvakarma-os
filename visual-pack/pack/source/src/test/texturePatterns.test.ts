import { describe, expect, it } from 'vitest';
import {
  drawPattern,
  PATTERN_KEYS,
  samplePatternColor,
} from '@/core/texturePatterns';

function createMockContext(): CanvasRenderingContext2D {
  const noop = () => undefined;
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    arc: noop,
    ellipse: noop,
    fill: noop,
    stroke: noop,
    setLineDash: noop,
  } as unknown as CanvasRenderingContext2D;
}

describe('texturePatterns', () => {
  it('draws every pattern without throwing', () => {
    const ctx = createMockContext();
    for (const key of PATTERN_KEYS) {
      expect(() => drawPattern(ctx, key, 64)).not.toThrow();
    }
  });

  it('returns deterministic sample colors', () => {
    const a = samplePatternColor('wood', 12, 18);
    const b = samplePatternColor('wood', 12, 18);
    const c = samplePatternColor('wood', 12, 40);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('includes water normal pattern key', () => {
    expect(PATTERN_KEYS).toContain('waterNormal');
  });
});
