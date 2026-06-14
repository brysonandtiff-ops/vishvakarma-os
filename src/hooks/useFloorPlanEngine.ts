import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import type { ToolType, WorkspaceMode } from '@/types';
import {
  ensureDefaultFloors,
  filterOpeningsByFloor,
  filterRoomsByFloor,
  filterByFloorIndex,
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
  const rooms = useMemo(
    () => filterRoomsByFloor(snapshot.manifest.rooms ?? [], activeFloorIndex),
    [snapshot.manifest.rooms, activeFloorIndex],
  );

  const furniture = useMemo(
    () => snapshot.manifest.furniture ?? [],
    [snapshot.manifest.furniture],
  );
  const mepSymbols = useMemo(
    () => snapshot.manifest.mepSymbols ?? [],
    [snapshot.manifest.mepSymbols],
  );
  const landscapeElements = useMemo(
    () => snapshot.manifest.landscapeElements ?? [],
    [snapshot.manifest.landscapeElements],
  );
  const terrain = useMemo(
    () => snapshot.manifest.terrain ?? [],
    [snapshot.manifest.terrain],
  );
  const fixtures = useMemo(
    () => filterByFloorIndex(snapshot.manifest.fixtures ?? [], activeFloorIndex),
    [snapshot.manifest.fixtures, activeFloorIndex],
  );
  const staircases = useMemo(
    () => snapshot.manifest.staircases ?? [],
    [snapshot.manifest.staircases],
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
    rooms,
    furniture,
    mepSymbols,
    landscapeElements,
    terrain,
    fixtures,
    staircases,
    costItems: snapshot.manifest.costItems ?? [],
    materials: snapshot.manifest.materials ?? [],
    dimensionVisibility: snapshot.manifest.dimensionVisibility ?? true,
    northOrientation: snapshot.manifest.northOrientation ?? 0,
    lighting: snapshot.manifest.lighting,
    gridSize: snapshot.manifest.gridSize,
    engine,
    setTool,
    setWorkspaceMode,
  };
}
