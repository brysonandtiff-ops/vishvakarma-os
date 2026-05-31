import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { connectToRoom, disconnectFromRoom, getCollaborationEngine, broadcastCursor } from '@/modules/collaborationEngine';
import type { Point2D } from '@/types';

interface EditorCollaborationBarProps {
  projectName: string;
}

export default function EditorCollaborationBar({ projectName }: EditorCollaborationBarProps) {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [active, setActive] = useState(false);
  const supabaseReady = backendStatus.isConfigured && backendStatus.provider === 'supabase';

  useEffect(() => {
    if (!supabaseReady || !user) {
      setActive(false);
      setOnlineCount(0);
      return;
    }

    const engine = getCollaborationEngine();
    const roomId = `project-${projectName.trim().toLowerCase().replace(/\s+/g, '-') || 'workspace'}`;
    const userId = user.id;
    const userName = user.email?.split('@')[0] ?? 'Architect';

    void connectToRoom(roomId, userId, userName).then(() => {
      setActive(engine.isConnected());
      setOnlineCount(engine.getOnlineUsers().length);
    });

    const interval = window.setInterval(() => {
      setOnlineCount(engine.getOnlineUsers().length);
      setActive(engine.isConnected());
    }, 3000);

    return () => {
      window.clearInterval(interval);
      void disconnectFromRoom();
    };
  }, [projectName, supabaseReady, user]);

  const label = supabaseReady
    ? active
      ? `Collaboration active · ${onlineCount} online`
      : 'Connecting collaboration…'
    : 'Local session';

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-ws-border bg-ws-toolbar px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ws-text-dim"
      data-testid="editor-collaboration-bar"
    >
      <Users className="h-3 w-3 text-primary" />
      {label}
    </div>
  );
}

export function useCollaborationCursorBroadcast(currentTool: string) {
  const supabaseReady = backendStatus.isConfigured && backendStatus.provider === 'supabase';

  return (point: Point2D) => {
    if (!supabaseReady) return;
    broadcastCursor(point.x, point.y, currentTool);
  };
}
