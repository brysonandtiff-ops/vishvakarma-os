import { useCallback, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import type { ToolType, WorkspaceMode } from '@/types';

export function useFloorPlanEngine() {
  const engine = getFloorPlanEngine();
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  const setTool = useCallback((tool: ToolType) => engine.setTool(tool), [engine]);
  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => engine.setWorkspaceMode(mode), [engine]);

  return {
    ...snapshot,
    walls: snapshot.manifest.walls,
    openings: snapshot.manifest.openings,
    labels: snapshot.manifest.labels ?? [],
    dimensions: snapshot.manifest.dimensions ?? [],
    rooms: snapshot.manifest.rooms ?? [],
    furniture: snapshot.manifest.furniture ?? [],
    mepSymbols: snapshot.manifest.mepSymbols ?? [],
    landscapeElements: snapshot.manifest.landscapeElements ?? [],
    costItems: snapshot.manifest.costItems ?? [],
    materials: snapshot.manifest.materials ?? [],
    fixtures: snapshot.manifest.fixtures ?? [],
    dimensionVisibility: snapshot.manifest.dimensionVisibility ?? true,
    northOrientation: snapshot.manifest.northOrientation ?? 0,
    lighting: snapshot.manifest.lighting,
    gridSize: snapshot.manifest.gridSize,
    engine,
    setTool,
    setWorkspaceMode,
  };
}
