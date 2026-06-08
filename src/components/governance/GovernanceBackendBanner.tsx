import { AlertCircle } from 'lucide-react';
import { backendStatus } from '@/backend/backendConfig';

export function GovernanceBackendBanner() {
  if (backendStatus.isConfigured) return null;

  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-foreground"
      role="status"
      data-testid="governance-backend-banner"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <div>
        <p className="font-semibold">Local workspace mode</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Governance data is read-only until Firebase is configured. Cloud create and update actions are disabled.
          {backendStatus.missingKeys.length > 0 && (
            <> Missing: {backendStatus.missingKeys.join(', ')}.</>
          )}
        </p>
      </div>
    </div>
  );
}
