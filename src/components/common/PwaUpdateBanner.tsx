import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { activatePendingPwaUpdate } from '@/pwaAutoUpdate';
import {
  getPwaUpdateState,
  PWA_UPDATE_STATE_EVENT,
  type PwaUpdateState,
} from '@/pwaUpdateSafety';

export default function PwaUpdateBanner() {
  const [state, setState] = useState<PwaUpdateState>(getPwaUpdateState);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleState = (event: Event) => {
      const next = (event as CustomEvent<PwaUpdateState>).detail;
      setState(next ?? getPwaUpdateState());
      if (next?.pending) setDismissed(false);
    };

    window.addEventListener(PWA_UPDATE_STATE_EVENT, handleState);
    return () => window.removeEventListener(PWA_UPDATE_STATE_EVENT, handleState);
  }, []);

  if (!state.pending || dismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[120] mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur"
    >
      <div className="flex min-w-0 items-start gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">Update ready</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.blocked
              ? 'Your editor has unsaved work. Save or export it before reloading.'
              : 'Reload when convenient to use the newest Vishvakarma.OS build.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
          Later
        </Button>
        <Button size="sm" onClick={() => activatePendingPwaUpdate()}>
          Reload now
        </Button>
      </div>
    </aside>
  );
}
