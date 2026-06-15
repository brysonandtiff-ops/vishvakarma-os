import { mapCanvasBufferToWorld } from '@/utils/canvasPointerCoords';
import type { CanvasViewportState } from '@/types';

export const MIN_CANVAS_ZOOM = 0.25;
export const MAX_CANVAS_ZOOM = 4;

export function clampCanvasZoom(zoom: number): number {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, zoom));
}

export function computeWheelZoomFactor(deltaY: number): number {
  return deltaY > 0 ? 0.9 : 1.1;
}

export function computePinchZoomFactor(prevDistance: number, nextDistance: number): number {
  if (prevDistance <= 0) return 1;
  return nextDistance / prevDistance;
}

export function computeZoomedViewport(
  viewport: CanvasViewportState,
  newZoom: number,
  anchorBufferX: number,
  anchorBufferY: number,
): Partial<CanvasViewportState> {
  const zoom = clampCanvasZoom(newZoom);
  const worldBefore = mapCanvasBufferToWorld({ x: anchorBufferX, y: anchorBufferY }, viewport);
  return {
    zoom,
    panX: anchorBufferX - worldBefore.x * zoom,
    panY: anchorBufferY - worldBefore.y * zoom,
  };
}

export function computeStepZoomFactor(direction: 'in' | 'out'): number {
  return direction === 'in' ? 1.1 : 0.9;
}
