import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import type { ToolType, WorkspaceMode } from '@/types';
import {
  ensureDefaultFloors,
  filterOpeningsByFloor,
  filterWallsByFloor,
  getActiveFloorIndex,
} from '@/utils/floorHelpers';

export function useFloorPlanEngine() {
  const engine = getFloorPlanEngine();
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  const setTool = useCallback((tool: ToolType) => engine.setTool(tool), [engine]);
  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => engine.setWorkspaceMode(mode), [engine]);

  const manifest = useMemo(() => ensureDefaultFloors(snapshot.manifest), [snapshot.manifest]);
  const activeFloorIndex = getActiveFloorIndex(manifest);
  const floors = manifest.floors ?? [];
  const walls = useMemo(
    () => filterWallsByFloor(manifest.walls, activeFloorIndex),
    [manifest.walls, activeFloorIndex],
  );
  const openings = useMemo(
    () => filterOpeningsByFloor(manifest.openings, manifest.walls, activeFloorIndex),
    [manifest.openings, manifest.walls, activeFloorIndex],
  );

  return {
    ...snapshot,
    manifest,
    floors,
    activeFloorIndex,
    walls,
    openings,
    labels: snapshot.manifest.labels ?? [],
    dimensions: snapshot.manifest.dimensions ?? [],
    rooms: snapshot.manifest.rooms ?? [],
    furniture: snapshot.manifest.furniture ?? [],
    mepSymbols: snapshot.manifest.mepSymbols ?? [],
    landscapeElements: snapshot.manifest.landscapeElements ?? [],
    terrain: snapshot.manifest.terrain ?? [],
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
