import type { OptimizationExplanation } from '@/domain/optimization/types';

export interface ScorerResult {
  score: number;
  explanation: OptimizationExplanation;
}

export interface BatchScoringContext {
  medianCost: number;
  targetBudget?: number;
  batchSize: number;
}
