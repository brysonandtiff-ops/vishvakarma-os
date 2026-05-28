import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Workspace Notifications strip — high visibility alert for data mode posture.
 * Specifically handles the local-only Firebase/Supabase fallback notification.
 */
export function WorkspaceNotifications() {
  const { mode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (mode !== 'local-only' || dismissed) return null;

  const handleRecoverData = () => {
    toast.info('Attempting to recover data and transition to cloud mode...');
    // In a real scenario, this would trigger a more complex process:
    // 1. Attempt to re-authenticate with Firebase/Supabase.
    // 2. If successful, prompt user to upload local draft/changes.
    // 3. Clear local-only state.
    console.log('Recover Data button clicked.');
  };

  return (
    <div className="relative vish-notifications-strip flex h-9 w-full shrink-0 items-center px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-warning backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 animate-pulse" />
        <span>LOCAL-ONLY DEMO MODE</span>
      </div>
      <div className="h-3.5 w-px bg-warning/30 mx-4" />
      <div className="flex items-center gap-2 font-medium tracking-normal text-warning/80 normal-case">
        <Database className="h-3.5 w-3.5 opacity-80" />
        <span>Data persistent in browser only · Cloud connectivity disabled</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecoverData}
          className="h-6 text-xs text-warning border-warning/30 bg-warning/10 hover:bg-warning/20 hover:text-warning tap-highlight-none"
        >
          Recover Data
        </Button>
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