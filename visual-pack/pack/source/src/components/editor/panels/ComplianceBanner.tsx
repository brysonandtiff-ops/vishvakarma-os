import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFailFindings } from '@/services/compliance/complianceGate';
import type { ComplianceAuditReport } from '@/modules/compliance/types';

export function ComplianceBanner({
  report,
  onOpenCompliance,
}: {
  report: ComplianceAuditReport;
  onOpenCompliance?: () => void;
}) {
  if (!report.blocked) return null;

  const fails = getFailFindings(report);
  const primary = fails[0]?.message ?? 'Building compliance failure';
  const others = fails.length > 1 ? fails.length - 1 : 0;

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm"
      data-testid="compliance-banner"
      role="alert"
    >
      <div className="flex min-w-0 items-center gap-2 text-destructive">
        <AlertOctagon className="h-4 w-4 shrink-0" />
        <p className="truncate font-medium">
          Export blocked — {primary}
          {others > 0 ? ` (and ${others} other${others === 1 ? '' : 's'})` : ''}
        </p>
      </div>
      {onOpenCompliance && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={onOpenCompliance}
          data-testid="compliance-banner-view"
        >
          View compliance
        </Button>
      )}
    </div>
  );
}
