import type { OptimizationBatch, OptimizationBatchRecord } from '@/domain/optimization/types';

export function buildOptimizationBatchRecord(
  batch: OptimizationBatch,
  userId = 'local'
): OptimizationBatchRecord {
  return {
    id: batch.id,
    userId,
    input: {
      prompt: batch.input.prompt,
      targetBudget: batch.input.targetBudget,
      lifestyleGoals: batch.input.lifestyleGoals,
      sessionId: batch.input.sessionId,
    },
    winnerId: batch.winnerId,
    moatGain: batch.report.moatGain,
    candidateSummaries: batch.candidates.map((candidate) => {
      const intel = candidate.building.costSummary.intelligence;
      return {
        id: candidate.id,
        label: candidate.label,
        overallScore: candidate.overallScore,
        rank: candidate.rank,
        estimatedCost: candidate.building.costSummary.total,
        costBestCase: intel?.scenarios.bestCase,
        costWorstCase: intel?.scenarios.worstCase,
        costMedian: intel?.scenarios.median,
        costConfidence: intel?.confidence.score,
        costRiskLevel: intel?.risk.level,
        permitReady: !candidate.building.complianceReport.blocked,
      };
    }),
    createdAt: batch.createdAt,
  };
}
