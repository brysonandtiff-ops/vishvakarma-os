import { useState } from 'react';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Database, ShieldAlert, X } from 'lucide-react';

/**
 * Workspace Notifications strip — high visibility alert for local-only mode.
 */
export function WorkspaceNotifications() {
  const { mode } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const providerLabel = 'Supabase';

  if (mode !== 'local-only' || dismissed) return null;

  return (
    <div className="relative vish-notifications-strip flex h-9 w-full shrink-0 items-center px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-warning backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 animate-pulse" />
        <span>Local Draft mode</span>
      </div>
      <div className="h-3.5 w-px bg-warning/30 mx-4" />
      <div className="flex items-center gap-2 font-medium tracking-normal text-warning/80 normal-case">
        <Database className="h-3.5 w-3.5 opacity-80" />
        <span>
          Browser-only persistence · Configure {providerLabel} env vars for Cloud Save
          {backendStatus.missingKeys.length > 0 ? ` (${backendStatus.missingKeys.join(', ')})` : ''}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-warning/60 transition-all hover:bg-warning/10 hover:text-warning tap-highlight-none"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}