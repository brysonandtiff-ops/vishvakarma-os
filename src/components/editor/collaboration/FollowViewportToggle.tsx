import { useState } from 'react';
import { Eye } from 'lucide-react';
import type { Presence } from '@/collaboration/types';

interface FollowViewportToggleProps {
  presences: Presence[];
  onFollow: (presence: Presence) => void;
}

export default function FollowViewportToggle({ presences, onFollow }: FollowViewportToggleProps) {
  const [open, setOpen] = useState(false);
  const remote = presences.filter((presence) => presence.viewport);

  if (remote.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-ws-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ws-text-dim hover:text-primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <Eye className="h-3 w-3" />
        Follow
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[8rem] rounded border border-ws-border bg-ws-toolbar p-1 shadow-lg">
          {remote.map((presence) => (
            <button
              key={presence.userId}
              type="button"
              className="block w-full rounded px-2 py-1 text-left text-[10px] hover:bg-ws-border/40"
              onClick={() => {
                onFollow(presence);
                setOpen(false);
              }}
            >
              {presence.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
