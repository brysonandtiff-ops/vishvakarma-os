import { Eye } from 'lucide-react';
import type { Presence } from '@/collaboration/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FollowViewportToggleProps {
  presences: Presence[];
  onFollow: (presence: Presence) => void;
}

export default function FollowViewportToggle({ presences, onFollow }: FollowViewportToggleProps) {
  const remote = presences.filter((presence) => presence.viewport);

  if (remote.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="touch-target inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border border-ws-border px-2 text-[10px] font-semibold uppercase tracking-wide text-ws-text-dim hover:text-primary"
          data-testid="collab-follow-toggle"
          aria-label="Follow collaborator viewport"
        >
          <Eye className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Follow</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {remote.map((presence) => (
          <button
            key={presence.userId}
            type="button"
            className="touch-target flex min-h-[44px] w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted"
            onClick={() => onFollow(presence)}
          >
            {presence.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
