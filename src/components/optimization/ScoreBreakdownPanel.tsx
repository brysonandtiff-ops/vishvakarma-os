import type { OptimizationCandidate } from '@/domain/optimization/types';
import { toDisplayScoresForCandidate } from '@/services/optimization/displayDimensions';
import { VishEmptyState } from '@/components/common/vish-primitives/VishEmptyState';

export default function ScoreBreakdownPanel({ candidate }: { candidate: OptimizationCandidate | null }) {
  if (!candidate) {
    return (
      <VishEmptyState label="Select a candidate to view score breakdown" />
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
    <div className="rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 shadow-xl backdrop-blur-xl" data-testid="score-breakdown">
      <h3 className="mb-3 font-semibold text-white">{candidate.label} — Score Breakdown</h3>
      <div className="space-y-3">
        {displayScores.map((score) => (
          <div key={score.dimension} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{score.label}</span>
              <span className="font-bold text-vish-gold">{score.score}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-vish-navy-950/50">
              <div
                className="h-full rounded-full bg-vish-gold transition-all shadow-[0_0_8px_rgba(201,138,46,0.8)]"
                style={{ width: `${score.score}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{explanationFor(score.dimension)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
