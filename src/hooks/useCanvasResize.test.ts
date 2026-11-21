import { describe, expect, it } from 'vitest';
import { computeMetrics } from './useCanvasResize';

describe('2D Focus canvas sizing', () => {
  it('fills the measured stage in focus regardless of the old aspect ratio', () => {
    const result = computeMetrics(1500, 750, 1200, { fitContainer: true });
    expect(result.displayWidth).toBe(1500);
    expect(result.displayHeight).toBe(750);
  });

  it('preserves the standard editor max width and 3:2 ratio when focus is off', () => {
    const result = computeMetrics(1500, 800, 1200);
    expect(result.displayWidth).toBe(1200);
    expect(result.displayHeight).toBe(800);
  });

  it('caps the high-DPI backing bitmap on large monitors', () => {
    const result = computeMetrics(3840, 2160, 1200, { fitContainer: true });
    expect(result.displayWidth).toBe(3840);
    expect(result.displayHeight).toBe(2160);
    expect(result.bufferWidth * result.bufferHeight).toBeLessThanOrEqual(8_050_000);
  });

  it('keeps geometry finite for zero-sized stages', () => {
    const result = computeMetrics(0, 0, 1200, { fitContainer: true });
    expect(result.displayWidth).toBe(1);
    expect(result.displayHeight).toBe(1);
    expect(result.bufferWidth).toBeGreaterThan(0);
    expect(result.bufferHeight).toBeGreaterThan(0);
  });
});
