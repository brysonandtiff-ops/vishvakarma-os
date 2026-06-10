import type { PlanScoreDimensions } from '@/planning/types';

export interface ScoringWeightProfile {
  compliance: number;
  adjacency: number;
  zoningMargin: number;
  programFit: number;
  costEfficiency: number;
  circulation: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeightProfile = {
  compliance: 0.35,
  adjacency: 0.2,
  zoningMargin: 0.15,
  programFit: 0.1,
  costEfficiency: 0.1,
  circulation: 0.1,
};

export function computeWeightedTotal(
  dimensions: PlanScoreDimensions,
  weights: ScoringWeightProfile = DEFAULT_SCORING_WEIGHTS,
): number {
  return (
    dimensions.compliance * weights.compliance +
    dimensions.adjacency * weights.adjacency +
    dimensions.zoningMargin * weights.zoningMargin +
    dimensions.programFit * weights.programFit +
    dimensions.costEfficiency * weights.costEfficiency +
    dimensions.circulation * weights.circulation
  );
}
