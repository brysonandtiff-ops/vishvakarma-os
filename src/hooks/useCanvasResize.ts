import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { useEffect, useState, type RefObject } from 'react';

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_ASPECT = 3 / 2;
const MAX_DEVICE_PIXEL_RATIO = 2;
const COARSE_HEAVY_DPR_CAP = 1.5;
const COARSE_HEAVY_WALL_THRESHOLD = 10;

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

export interface CanvasResizeOptions {
  wallCount?: number;
  coarsePointer?: boolean;
  /** Fill the actual editor stage in 2D Focus, retaining normal aspect elsewhere. */
  fitContainer?: boolean;
}

function resolveDevicePixelRatio(options?: CanvasResizeOptions): number {
  if (typeof window === 'undefined') return 1;
  const base = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  if (
    options?.coarsePointer &&
    (options.wallCount ?? 0) >= COARSE_HEAVY_WALL_THRESHOLD
  ) {
    return Math.min(base, COARSE_HEAVY_DPR_CAP);
  }
  return base;
}

export function computeMetrics(
  containerWidth: number,
  containerHeight: number,
  maxWidth = DEFAULT_MAX_WIDTH,
  options?: CanvasResizeOptions,
): CanvasResizeMetrics {
  const safeWidth = Math.max(1, containerWidth);
  const safeHeight = Math.max(1, containerHeight);

  let displayWidth = options?.fitContainer ? safeWidth : Math.min(safeWidth, maxWidth);
  let displayHeight = options?.fitContainer ? safeHeight : displayWidth / DEFAULT_ASPECT;

  if (!options?.fitContainer && displayHeight > safeHeight) {
    displayHeight = safeHeight;
    displayWidth = displayHeight * DEFAULT_ASPECT;
  }

  displayWidth = Math.max(1, Math.round(displayWidth));
  displayHeight = Math.max(1, Math.round(displayHeight));

  // Keep a large desktop focus sheet responsive without allocating an
  // unbounded high-DPI bitmap (8 million backing pixels maximum).
  const dpr = Math.min(
    resolveDevicePixelRatio(options),
    Math.sqrt(8_000_000 / (displayWidth * displayHeight)),
  );

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
  options?: CanvasResizeOptions,
): CanvasResizeMetrics {
  const isCoarsePointer = useCoarsePointer();
  const coarsePointer = options?.coarsePointer ?? isCoarsePointer;
  const wallCount = options?.wallCount ?? 0;
  const fitContainer = options?.fitContainer ?? false;

  const [metrics, setMetrics] = useState<CanvasResizeMetrics>(() =>
    computeMetrics(maxWidth, maxWidth / DEFAULT_ASPECT, maxWidth, {
      coarsePointer,
      wallCount,
      fitContainer,
    }),
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measurementTarget =
      element.closest<HTMLElement>('.vish-canvas-stage') ?? element.parentElement ?? element;

    let frameId: number | undefined;
    let orientationTimerId: number | undefined;

    const update = () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = undefined;
        const rect = measurementTarget.getBoundingClientRect();
        setMetrics(
          computeMetrics(rect.width, rect.height, maxWidth, {
            coarsePointer,
            wallCount,
            fitContainer,
          }),
        );
      });
    };

    const updateAfterOrientationChange = () => {
      update();
      if (orientationTimerId !== undefined) {
        window.clearTimeout(orientationTimerId);
      }
      orientationTimerId = window.setTimeout(update, 250);
    };

    const updateImmediately = () => {
      const rect = measurementTarget.getBoundingClientRect();
      setMetrics(
        computeMetrics(rect.width, rect.height, maxWidth, {
          coarsePointer,
          wallCount,
          fitContainer,
        }),
      );
    };

    updateImmediately();

    const observer = new ResizeObserver(update);
    observer.observe(measurementTarget);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', updateAfterOrientationChange);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
      if (orientationTimerId !== undefined) {
        window.clearTimeout(orientationTimerId);
      }
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', updateAfterOrientationChange);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [containerRef, maxWidth, coarsePointer, wallCount, fitContainer]);

  return metrics;
}
