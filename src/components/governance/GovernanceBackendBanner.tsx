import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backendStatus } from '@/backend/backendConfig';

const DISMISS_KEY = 'vishvakarma:governance-banner-dismissed';

export function GovernanceBackendBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (backendStatus.isConfigured || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between"
      role="status"
      data-testid="governance-backend-banner"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Local workspace.</span> Connect Firebase to enable cloud specs and registry writes.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" variant="outline" className="touch-target h-8">
          <Link to="/auth">Connect</Link>
        </Button>
        <button
          type="button"
          className="touch-target flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss banner"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
