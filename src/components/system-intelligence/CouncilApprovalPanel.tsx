import type { CouncilAssessment } from '@/domain/council-intelligence/types';
import { Badge } from '@/components/ui/badge';

const LIKELIHOOD_LABELS: Record<CouncilAssessment['likelihood'], string> = {
  high: 'High approval likelihood',
  medium: 'Moderate approval likelihood',
  low: 'Low approval likelihood',
};

export default function CouncilApprovalPanel({
  assessment,
}: {
  assessment: CouncilAssessment;
}) {
  return (
    <div
      className="rounded-xl border border-border/60 bg-black/40 p-4"
      data-testid="council-approval-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-earth-500">Council approval simulation</h3>
        <Badge variant={assessment.likelihood === 'high' ? 'default' : 'secondary'}>
          {LIKELIHOOD_LABELS[assessment.likelihood]}
        </Badge>
      </div>
      <p className="mt-2 text-2xl font-bold">{assessment.approvalScore}/100</p>
      <p className="mt-1 text-xs text-muted-foreground">{assessment.explanation.summary}</p>

      {assessment.blockers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-red-400">Blockers</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {assessment.blockers.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {assessment.warnings.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-amber-500/90">Warnings</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {assessment.warnings.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {assessment.recommendedAdjustments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Recommended adjustments</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {assessment.recommendedAdjustments.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
