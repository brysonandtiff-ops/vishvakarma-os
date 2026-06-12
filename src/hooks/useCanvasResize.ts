import { useEffect, useState, type RefObject } from 'react';

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_ASPECT = 3 / 2;
const MAX_DEVICE_PIXEL_RATIO = 2;

export interface CanvasResizeMetrics {
  /** CSS display width in px */
  displayWidth: number;
  /** CSS display height in px */
  displayHeight: number;
  /** Canvas buffer width (includes DPR) */
  bufferWidth: number;
  /** Canvas buffer height (includes DPR) */
  bufferHeight: number;
  scaleX: number;
  scaleY: number;
}

function computeMetrics(
  containerWidth: number,
  containerHeight: number,
  maxWidth = DEFAULT_MAX_WIDTH,
): CanvasResizeMetrics {
  const safeWidth = Math.max(1, containerWidth);
  const safeHeight = Math.max(1, containerHeight);

  let displayWidth = Math.min(safeWidth, maxWidth);
  let displayHeight = displayWidth / DEFAULT_ASPECT;

  if (displayHeight > safeHeight) {
    displayHeight = safeHeight;
    displayWidth = displayHeight * DEFAULT_ASPECT;
  }

  displayWidth = Math.max(1, Math.round(displayWidth));
  displayHeight = Math.max(1, Math.round(displayHeight));

  const dpr =
    typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
      : 1;

  const bufferWidth = Math.max(1, Math.round(displayWidth * dpr));
  const bufferHeight = Math.max(1, Math.round(displayHeight * dpr));

  return {
    displayWidth,
    displayHeight,
    bufferWidth,
    bufferHeight,
    scaleX: bufferWidth / displayWidth,
    scaleY: bufferHeight / displayHeight,
  };
}

export function useCanvasResize(
  containerRef: RefObject<HTMLElement | null>,
  maxWidth = DEFAULT_MAX_WIDTH,
): CanvasResizeMetrics {
  const [metrics, setMetrics] = useState<CanvasResizeMetrics>(() =>
    computeMetrics(maxWidth, maxWidth / DEFAULT_ASPECT, maxWidth),
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setMetrics(computeMetrics(rect.width, rect.height, maxWidth));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, maxWidth]);

  return metrics;
}
