import { describe, expect, it } from 'vitest';
import {
  clampCanvasZoom,
  computePinchZoomFactor,
  computeStepZoomFactor,
  computeWheelZoomFactor,
  computeZoomedViewport,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
} from '@/utils/canvasViewportZoom';

describe('canvasViewportZoom', () => {
  it('clamps zoom within bounds', () => {
    expect(clampCanvasZoom(0.1)).toBe(MIN_CANVAS_ZOOM);
    expect(clampCanvasZoom(10)).toBe(MAX_CANVAS_ZOOM);
    expect(clampCanvasZoom(1)).toBe(1);
  });

  it('computes wheel and step zoom factors', () => {
    expect(computeWheelZoomFactor(10)).toBe(0.9);
    expect(computeWheelZoomFactor(-10)).toBe(1.1);
    expect(computeStepZoomFactor('in')).toBe(1.1);
    expect(computeStepZoomFactor('out')).toBe(0.9);
  });

  it('computes pinch scale ratio', () => {
    expect(computePinchZoomFactor(100, 150)).toBe(1.5);
    expect(computePinchZoomFactor(0, 100)).toBe(1);
  });

  it('zooms viewport around anchor buffer point', () => {
    const viewport = { panX: 0, panY: 0, zoom: 1 };
    const next = computeZoomedViewport(viewport, 2, 100, 100);
    expect(next.zoom).toBe(2);
    expect(next.panX).toBe(-100);
    expect(next.panY).toBe(-100);
  });
});
