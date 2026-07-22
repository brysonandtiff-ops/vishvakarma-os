import type { Point2D } from '@/types';
import type { CanvasViewportState } from '@/types';

export function mapPointerToCanvasBuffer(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  bufferWidth: number,
  bufferHeight: number,
): Point2D {
  const scaleX = rect.width > 0 ? bufferWidth / rect.width : 1;
  const scaleY = rect.height > 0 ? bufferHeight / rect.height : 1;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function mapCanvasBufferToWorld(
  bufferPoint: Point2D,
  viewport: CanvasViewportState,
): Point2D {
  return {
    x: (bufferPoint.x - viewport.panX) / viewport.zoom,
    y: (bufferPoint.y - viewport.panY) / viewport.zoom,
  };
}

export function mapPointerToWorldCoords(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  bufferWidth: number,
  bufferHeight: number,
  viewport: CanvasViewportState,
): Point2D {
  const buffer = mapPointerToCanvasBuffer(clientX, clientY, rect, bufferWidth, bufferHeight);
  return mapCanvasBufferToWorld(buffer, viewport);
}

export function mapWorldToCanvasBuffer(
  point: Point2D,
  viewport: CanvasViewportState,
): Point2D {
  return {
    x: viewport.panX + point.x * viewport.zoom,
    y: viewport.panY + point.y * viewport.zoom,
  };
}

export function mapCanvasBufferToDisplay(
  point: Point2D,
  bufferWidth: number,
  bufferHeight: number,
  displayWidth: number,
  displayHeight: number,
): Point2D {
  return {
    x: bufferWidth > 0 ? (point.x / bufferWidth) * displayWidth : point.x,
    y: bufferHeight > 0 ? (point.y / bufferHeight) * displayHeight : point.y,
  };
}
