import type { Point2D } from '@/types';

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
