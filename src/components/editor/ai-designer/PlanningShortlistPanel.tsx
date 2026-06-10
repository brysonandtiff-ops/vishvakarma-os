import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { PlanScore } from '@/planning/types';
import { Button } from '@/components/ui/button';
import SitePlanPreview from '@/components/editor/ai-designer/SitePlanPreview';

export default function PlanningShortlistPanel({
  shortlist,
  rankedScores,
  selectedId,
  onSelectCandidate,
}: {
  shortlist: GeneratedBuilding[];
  rankedScores: PlanScore[];
  selectedId: string;
  onSelectCandidate: (candidateId: string) => void;
}) {
  if (shortlist.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4" data-testid="planning-shortlist">
      <p className="text-sm font-semibold">Top plan options</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {shortlist.map((building, index) => {
          const score = rankedScores[index];
          const candidateId = score?.candidateId ?? `plan-${index + 1}`;
          const isSelected = candidateId === selectedId;

          return (
            <div
              key={candidateId}
              className={`rounded-lg border p-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-border/60'}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{candidateId}</span>
                <span className="text-[10px] text-muted-foreground">
                  {score ? `${Math.round(score.total)}/100` : '—'}
                </span>
              </div>
              <div className="pointer-events-none max-h-28 overflow-hidden rounded-md border border-border/40">
                <SitePlanPreview sitePlan={building.sitePlan} compact />
              </div>
              {!isSelected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full text-xs"
                  onClick={() => onSelectCandidate(candidateId)}
                  data-testid={`select-plan-${candidateId}`}
                >
                  Use this plan
                </Button>
              )}
              {isSelected && (
                <p className="mt-2 text-center text-[10px] font-medium text-primary">Selected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
