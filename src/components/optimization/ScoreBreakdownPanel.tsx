import type { OptimizationCandidate } from '@/domain/optimization/types';

const CATEGORY_LABELS: Record<string, string> = {
  compliance: 'Compliance',
  construction_cost: 'Construction Cost',
  natural_light: 'Natural Light',
  energy: 'Energy',
  circulation: 'Circulation',
  privacy: 'Privacy',
  resale: 'Resale',
  buildability: 'Buildability',
  overall: 'Overall',
};

export default function ScoreBreakdownPanel({ candidate }: { candidate: OptimizationCandidate | null }) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
        Select a candidate to view score breakdown.
      </div>
    );
  }

  const categoryScores = candidate.scores.filter((s) => s.category !== 'overall');

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="score-breakdown">
      <h3 className="mb-3 font-semibold">{candidate.label} — Score Breakdown</h3>
      <div className="space-y-3">
        {categoryScores.map((score) => (
          <div key={score.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{CATEGORY_LABELS[score.category] ?? score.category}</span>
              <span className="font-bold">{score.score}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${score.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{score.explanation.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
