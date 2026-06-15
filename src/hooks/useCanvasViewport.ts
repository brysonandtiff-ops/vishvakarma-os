import { useCallback, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import type { CanvasViewportState } from '@/types';

export function useCanvasViewport(): {
  canvasViewport: CanvasViewportState;
  setCanvasViewport: (viewport: Partial<CanvasViewportState>) => void;
  resetCanvasViewport: () => void;
} {
  const engine = getFloorPlanEngine();

  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubMain = engine.subscribe(listener);
      const unsubViewport = engine.subscribeViewport(listener);
      return () => {
        unsubMain();
        unsubViewport();
      };
    },
    [engine],
  );

  const getSnapshot = useCallback(() => engine.getSnapshot().session.canvasViewport, [engine]);

  const canvasViewport = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setCanvasViewport = useCallback(
    (viewport: Partial<CanvasViewportState>) => engine.setCanvasViewport(viewport),
    [engine],
  );

  const resetCanvasViewport = useCallback(() => engine.resetCanvasViewport(), [engine]);

  return { canvasViewport, setCanvasViewport, resetCanvasViewport };
}
