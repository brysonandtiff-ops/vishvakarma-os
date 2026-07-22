import { describe, expect, it } from 'vitest';
import { mapCanvasBufferToDisplay, mapPointerToCanvasBuffer } from '@/utils/canvasPointerCoords';

describe('canvasPointerCoords', () => {
  it('scales pointer coordinates when CSS size differs from buffer size', () => {
    const rect = { left: 10, top: 20, width: 600, height: 400 };
    const point = mapPointerToCanvasBuffer(310, 220, rect, 1200, 800);

    expect(point.x).toBeCloseTo(600, 0);
    expect(point.y).toBeCloseTo(400, 0);
  });

  it('maps buffer coordinates to display coordinates', () => {
    const display = mapCanvasBufferToDisplay({ x: 600, y: 400 }, 1200, 800, 600, 400);

    expect(display.x).toBeCloseTo(300, 0);
    expect(display.y).toBeCloseTo(200, 0);
  });
});
