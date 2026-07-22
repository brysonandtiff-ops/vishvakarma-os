import type { OptimizationCandidate } from '@/domain/optimization/types';
import { toDisplayScoresForCandidate } from '@/services/optimization/displayDimensions';

export default function ScoreBreakdownPanel({ candidate }: { candidate: OptimizationCandidate | null }) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
        Select a candidate to view score breakdown.
      </div>
    );
  }

  const displayScores = toDisplayScoresForCandidate(candidate);
  const internalByCategory = new Map(
    candidate.scores.filter((s) => s.category !== 'overall').map((s) => [s.category, s]),
  );

  const explanationFor = (dimension: string) => {
    switch (dimension) {
      case 'compliance':
        return internalByCategory.get('compliance')?.explanation.summary;
      case 'cost':
        return internalByCategory.get('construction_cost')?.explanation.summary;
      case 'energy':
        return internalByCategory.get('energy')?.explanation.summary;
      case 'privacy':
        return internalByCategory.get('privacy')?.explanation.summary;
      case 'resale':
        return internalByCategory.get('resale')?.explanation.summary;
      case 'buildability':
        return internalByCategory.get('buildability')?.explanation.summary;
      default:
        return '';
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="score-breakdown">
      <h3 className="mb-3 font-semibold">{candidate.label} — Score Breakdown</h3>
      <div className="space-y-3">
        {displayScores.map((score) => (
          <div key={score.dimension} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{score.label}</span>
              <span className="font-bold">{score.score}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${score.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{explanationFor(score.dimension)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
