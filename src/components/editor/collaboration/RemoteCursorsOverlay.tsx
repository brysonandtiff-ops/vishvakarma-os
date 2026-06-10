import type { Point2D } from '@/types';
import type { Presence } from '@/collaboration/types';

interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  cursor: Point2D;
  activeTool?: string;
}

interface RemoteCursorsOverlayProps {
  presences: Presence[];
  currentUserId?: string;
  canvasToScreen?: (point: Point2D) => Point2D;
}

export default function RemoteCursorsOverlay({
  presences,
  currentUserId,
  canvasToScreen,
}: RemoteCursorsOverlayProps) {
  const cursors: RemoteCursor[] = presences
    .filter((presence) => presence.userId !== currentUserId)
    .map((presence) => ({
      userId: presence.userId,
      name: presence.name,
      color: presence.color,
      cursor: presence.cursor,
      activeTool: presence.activeTool,
    }));

  if (cursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {cursors.map((cursor) => {
        const screen = canvasToScreen ? canvasToScreen(cursor.cursor) : cursor.cursor;
        return (
          <div
            key={cursor.userId}
            className="absolute"
            style={{
              transform: `translate(${screen.x}px, ${screen.y}px)`,
            }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow-sm">
              <path
                d="M0 0 L0 14 L4 10 L7 16 L9 15 L6 9 L12 9 Z"
                fill={cursor.color}
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            <span
              className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
              {cursor.activeTool ? ` · ${cursor.activeTool}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
