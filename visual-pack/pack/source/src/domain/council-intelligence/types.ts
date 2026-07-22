export type CouncilLikelihood = 'high' | 'medium' | 'low';

export interface CouncilAssessment {
  approvalScore: number;
  likelihood: CouncilLikelihood;
  blockers: string[];
  warnings: string[];
  recommendedAdjustments: string[];
  explanation: { summary: string; metrics: Record<string, number> };
}
