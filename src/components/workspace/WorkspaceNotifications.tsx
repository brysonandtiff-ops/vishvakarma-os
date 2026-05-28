import { useAuth } from '@/contexts/AuthContext';
import { Database, ShieldAlert } from 'lucide-react';

/**
 * Workspace Notifications strip — high visibility alert for data mode posture.
 * Specifically handles the local-only Firebase/Supabase fallback notification.
 */
export function WorkspaceNotifications() {
  const { mode } = useAuth();

  if (mode !== 'local-only') return null;

  return (
    <div className="vish-notifications-strip flex h-8 w-full shrink-0 items-center justify-center gap-2.5 bg-warning/15 px-4 text-[10px] font-medium tracking-wide text-warning border-b border-warning/20">
      <div className="flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>LOCAL-ONLY DEMO MODE</span>
      </div>
      <span className="opacity-40">|</span>
      <div className="flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5" />
        <span>Data persistent in browser only — Cloud connectivity disabled</span>
      </div>
    </div>
  );
}