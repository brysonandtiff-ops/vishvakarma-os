import type { PlanExplanation, PlanScore } from '@/planning/types';

const DIMENSION_LABELS: Record<keyof PlanScore['dimensions'], string> = {
  compliance: 'Compliance',
  adjacency: 'Adjacency',
  zoningMargin: 'Zoning headroom',
  programFit: 'Program fit',
  costEfficiency: 'Cost efficiency',
  circulation: 'Circulation',
};

export default function PlanExplanationPanel({
  explanation,
  rankedScores,
  selectedId,
  candidateCount,
}: {
  explanation: PlanExplanation;
  rankedScores: PlanScore[];
  selectedId: string;
  candidateCount: number;
}) {
  const winner = rankedScores.find((s) => s.candidateId === selectedId) ?? rankedScores[0];

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm" data-testid="plan-explanation">
      <div>
        <p className="font-semibold">Why this plan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Evaluated {candidateCount} layout variants · selected {selectedId}
        </p>
      </div>

      <p className="text-muted-foreground">{explanation.summary}</p>

      {winner && (
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {(Object.keys(DIMENSION_LABELS) as Array<keyof PlanScore['dimensions']>).map((key) => (
            <div key={key} className="rounded-md border border-border/50 bg-background/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{DIMENSION_LABELS[key]}</p>
              <p className="font-medium">{Math.round(winner.dimensions[key])}/100</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Winning reasons</p>
        <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
          {explanation.winningReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      {explanation.tradeoffs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trade-offs vs runner-up</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
            {explanation.tradeoffs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
