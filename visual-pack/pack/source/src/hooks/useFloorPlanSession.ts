import { useCallback, useSyncExternalStore } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import type { ToolType, WorkspaceMode } from '@/types';

/** Session-only subscription — skips re-renders on pure geometry edits when used alone. */
export function useFloorPlanSession() {
  const engine = getFloorPlanEngine();
  const sessionRevision = useSyncExternalStore(
    engine.subscribeSession,
    () => engine.getSnapshot().sessionRevision,
    () => engine.getSnapshot().sessionRevision,
  );
  const session = engine.getSession();

  const setTool = useCallback((tool: ToolType) => engine.setTool(tool), [engine]);
  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => engine.setWorkspaceMode(mode), [engine]);

  return {
    session,
    sessionRevision,
    currentTool: session.currentTool,
    workspaceMode: session.workspaceMode,
    show3DView: session.show3DView,
    gridVisible: session.gridVisible,
    snapEnabled: session.snapEnabled,
    zenMode: session.zenMode,
    presentationLock: session.presentationLock,
    layerVisibility: session.layerVisibility,
    setTool,
    setWorkspaceMode,
  };
}
