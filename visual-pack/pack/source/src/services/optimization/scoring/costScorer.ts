import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';
import type { BatchScoringContext } from '@/services/optimization/scoring/scorerTypes';

export function scoreConstructionCost(
  building: GeneratedBuilding,
  context: BatchScoringContext,
): ScorerResult {
  const total = building.costSummary.total;
  const reference = context.targetBudget ?? context.medianCost;
  const ratio = reference > 0 ? total / reference : 1;

  let score: number;
  if (ratio <= 0.9) score = 95;
  else if (ratio <= 1.0) score = 85;
  else if (ratio <= 1.1) score = 70;
  else if (ratio <= 1.2) score = 55;
  else score = Math.max(20, Math.round(100 - (ratio - 1) * 80));

  const budgetNote = context.targetBudget
    ? ` against $${context.targetBudget.toLocaleString()} target`
    : ' against batch median';

  return {
    score,
    explanation: {
      summary: `Estimated construction cost $${total.toLocaleString()}${budgetNote} (${Math.round(ratio * 100)}% of reference).`,
      metrics: { totalCost: total, ratioToReference: Math.round(ratio * 100) },
    },
  };
}
