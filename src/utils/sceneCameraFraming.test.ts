import { describe, expect, it } from 'vitest';
import { calculateSceneCameraFrame } from './sceneCameraFraming';

const wall = (start: [number, number], end: [number, number], height = 240) => ({
  start: { x: start[0], y: start[1] },
  end: { x: end[0], y: end[1] },
  height,
});

describe('VISH 3D camera framing', () => {
  it('uses a stable fallback when the drawing has no walls', () => {
    expect(calculateSceneCameraFrame([])).toEqual({
      position: [7, 5.5, 7],
      target: [0, 1.2, 0],
    });
  });

  it('centres on the already origin-normalized model and aims at wall height', () => {
    const frame = calculateSceneCameraFrame([wall([500, 350], [900, 350])]);
    expect(frame.target).toEqual([0, 1.2, 0]);
    expect(frame.position[0]).toBeGreaterThan(5);
    expect(frame.position[1]).toBeGreaterThan(frame.target[1]);
  });

  it('zooms out for larger floor plans without exceeding a reasonable cap', () => {
    const compact = calculateSceneCameraFrame([wall([0, 0], [400, 0])]);
    const estate = calculateSceneCameraFrame([wall([0, 0], [2000, 2000])]);
    expect(estate.position[0]).toBeGreaterThan(compact.position[0]);
    expect(estate.position[0]).toBeLessThanOrEqual(70);
  });

  it('ignores invalid walls instead of creating non-finite camera positions', () => {
    const frame = calculateSceneCameraFrame([wall([Infinity, 0], [100, 0])]);
    expect(frame.position.every(Number.isFinite)).toBe(true);
    expect(frame.target.every(Number.isFinite)).toBe(true);
  });
});
