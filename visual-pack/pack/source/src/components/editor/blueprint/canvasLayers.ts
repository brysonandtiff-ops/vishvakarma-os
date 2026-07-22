import type { CanvasViewportState } from '@/types';

export function createLayerCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const layer = document.createElement('canvas');
  layer.width = Math.max(1, width);
  layer.height = Math.max(1, height);
  return layer;
}

export function blitLayer(
  target: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  viewport: CanvasViewportState,
) {
  target.save();
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.clearRect(0, 0, target.canvas.width, target.canvas.height);
  target.translate(viewport.panX, viewport.panY);
  target.scale(viewport.zoom, viewport.zoom);
  target.drawImage(layer, 0, 0);
  target.restore();
}
