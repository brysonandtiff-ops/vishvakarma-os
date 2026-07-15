import type { User } from '@/modules/collaborationEngine';

interface CollaboratorAvatarsProps {
  users: User[];
  maxVisible?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function CollaboratorAvatars({ users, maxVisible = 4 }: CollaboratorAvatarsProps) {
  const online = users.filter((user) => user.isOnline);
  if (online.length === 0) return null;

  const visible = online.slice(0, maxVisible);
  const overflow = online.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <span
          key={user.id}
          title={user.name}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-ws-toolbar text-[9px] font-bold text-white"
          style={{ backgroundColor: user.color }}
        >
          {initials(user.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-ws-border bg-ws-toolbar px-1 text-[9px] font-semibold text-ws-text-dim">
          +{overflow}
        </span>
      )}
    </div>
  );
}
