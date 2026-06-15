import { useCallback, useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import { collabPresenceModeLabel } from '@/collaboration/presenceReadOnly';
import {
  connectToRoom,
  disconnectFromRoom,
  getCollaborationEngine,
  broadcastCursor,
} from '@/modules/collaborationEngine';
import type { Presence } from '@/collaboration/types';
import type { Point2D, ProjectManifest, ViewportCameraState } from '@/types';
import CollaboratorAvatars from './collaboration/CollaboratorAvatars';
import FollowViewportToggle from './collaboration/FollowViewportToggle';

interface EditorCollaborationBarProps {
  projectId?: string;
  projectName: string;
  manifest: ProjectManifest;
  onPresenceChange?: (presences: Presence[]) => void;
  onFollowViewport?: (viewport: ViewportCameraState) => void;
}

export default function EditorCollaborationBar({
  projectId,
  projectName,
  manifest,
  onPresenceChange,
  onFollowViewport,
}: EditorCollaborationBarProps) {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [active, setActive] = useState(false);
  const [users, setUsers] = useState(() => getCollaborationEngine().getOnlineUsers());
  const [presences, setPresences] = useState<Presence[]>([]);
  const backendReady = backendStatus.isConfigured;

  useEffect(() => {
    if (!backendReady || !user || !projectId) {
      setActive(false);
      setOnlineCount(0);
      setUsers([]);
      setPresences([]);
      return;
    }

    const engine = getCollaborationEngine();
    const floorPlanEngine = getFloorPlanEngine();
    const userId = user.id;
    const userName = user.email?.split('@')[0] ?? 'Architect';

    void connectToRoom(projectId, userId, userName, {
      initialManifest: manifest,
      onManifestChange: (nextManifest, isRemote) => {
        const bridge = engine.getCollabSession().getBridge();
        if (bridge) {
          floorPlanEngine.setCollabBridge(bridge);
        }
        if (isRemote) {
          floorPlanEngine.applyRemoteManifest(nextManifest);
        }
      },
    }).then(() => {
      const bridge = engine.getCollabSession().getBridge();
      if (bridge) {
        floorPlanEngine.setCollabBridge(bridge);
      }
      setActive(engine.isConnected());
      setOnlineCount(engine.getOnlineUsers().length);
      setUsers(engine.getOnlineUsers());
    });

    const presenceUnsub = engine.getCollabSession().subscribePresence((nextPresences) => {
      setPresences(nextPresences);
      onPresenceChange?.(nextPresences);
    });

    const interval = window.setInterval(() => {
      setOnlineCount(engine.getOnlineUsers().length);
      setUsers(engine.getOnlineUsers());
      setActive(engine.isConnected());
    }, 3000);

    return () => {
      window.clearInterval(interval);
      presenceUnsub();
      floorPlanEngine.setCollabBridge(null);
      void disconnectFromRoom();
    };
  }, [backendReady, onPresenceChange, projectId, user]);

  const label = !projectId
    ? 'Save project to collaborate'
    : backendReady
      ? active
        ? `${collabPresenceModeLabel()} · ${onlineCount} online`
        : 'Connecting collaboration…'
      : 'Local session';

  return (
    <div
      className="vish-editor-collaboration-bar flex min-h-[44px] items-center gap-1.5 rounded-lg border border-ws-border bg-ws-toolbar px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ws-text-dim"
      data-testid="editor-collaboration-bar"
    >
      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <CollaboratorAvatars users={users} />
      <FollowViewportToggle
        presences={presences}
        onFollow={(presence) => onFollowViewport?.(presence.viewport)}
      />
      <span className="vish-editor-collaboration-bar__label">{label}</span>
    </div>
  );
}

export function useCollaborationCursorBroadcast(
  currentTool: string,
  viewport?: ViewportCameraState
) {
  const backendReady = backendStatus.isConfigured;
  const lastSentRef = useRef(0);
  const toolRef = useRef(currentTool);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    toolRef.current = currentTool;
    viewportRef.current = viewport;
  }, [currentTool, viewport]);

  return useCallback((point: Point2D) => {
    if (!backendReady || typeof document !== 'undefined' && document.hidden) return;
    const now = performance.now();
    if (now - lastSentRef.current < 80) return;
    lastSentRef.current = now;
    broadcastCursor(point.x, point.y, toolRef.current, viewportRef.current);
  }, [backendReady]);
}
