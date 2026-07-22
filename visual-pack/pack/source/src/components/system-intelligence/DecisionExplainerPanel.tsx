import type { OptimizationCandidate, OptimizationReport } from '@/domain/optimization/types';
import {
  buildDecisionBullets,
  buildDecisionHeadline,
} from '@/services/optimization/buildDecisionBullets';

export default function DecisionExplainerPanel({
  winner,
  runnerUp,
  report,
}: {
  winner: OptimizationCandidate;
  runnerUp: OptimizationCandidate;
  report: OptimizationReport;
}) {
  const headline = buildDecisionHeadline(report);
  const bullets = buildDecisionBullets(winner, runnerUp, report);

  return (
    <div
      className="rounded-xl border border-border/60 bg-black/40 p-4"
      data-testid="decision-explainer"
    >
      <h3 className="text-sm font-semibold text-earth-500">Why this design won</h3>
      <p className="mt-1 text-xs text-muted-foreground">{headline}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {bullets.map((bullet, index) => (
          <li key={`${bullet.source}-${index}`} className="flex gap-2">
            <span
              className={
                bullet.polarity === 'pro' ? 'shrink-0 text-green-500' : 'shrink-0 text-red-400'
              }
              aria-hidden
            >
              {bullet.polarity === 'pro' ? '+' : '−'}
            </span>
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
