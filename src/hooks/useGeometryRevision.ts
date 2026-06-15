import { useCallback, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';

export function useGeometryRevision(): number {
  const engine = getFloorPlanEngine();
  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine]);
  const getSnapshot = useCallback(() => engine.getSnapshot().geometryRevision, [engine]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
