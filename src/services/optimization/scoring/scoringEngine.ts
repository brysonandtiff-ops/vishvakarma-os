import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type {
  OptimizationCandidate,
  OptimizationObjective,
  OptimizationScore,
  OptimizationScoreCategory,
} from '@/domain/optimization/types';
import { scoreBuildability } from '@/services/optimization/scoring/buildabilityScorer';
import { scoreCirculation } from '@/services/optimization/scoring/circulationScorer';
import { scoreCompliance } from '@/services/optimization/scoring/complianceScorer';
import { scoreConstructionCost } from '@/services/optimization/scoring/costScorer';
import { scoreEnergy } from '@/services/optimization/scoring/energyScorer';
import { scoreNaturalLight } from '@/services/optimization/scoring/naturalLightScorer';
import { scorePrivacy } from '@/services/optimization/scoring/privacyScorer';
import { scoreResale } from '@/services/optimization/scoring/resaleScorer';
import type { BatchScoringContext } from '@/services/optimization/scoring/scorerTypes';
import { getWeightProfile } from '@/services/optimization/scoring/weightProfiles';

const CATEGORY_LABELS: Record<Exclude<OptimizationScoreCategory, 'overall'>, string> = {
  compliance: 'Compliance',
  construction_cost: 'Construction Cost',
  natural_light: 'Natural Light',
  energy: 'Energy',
  circulation: 'Circulation',
  privacy: 'Privacy',
  resale: 'Resale',
  buildability: 'Buildability',
};

export function scoreCandidate(
  building: GeneratedBuilding,
  objective: OptimizationObjective,
  context: BatchScoringContext,
): OptimizationScore[] {
  const weights = getWeightProfile(objective);

  const scorers: Array<{
    category: Exclude<OptimizationScoreCategory, 'overall'>;
    result: ReturnType<typeof scoreCompliance>;
  }> = [
    { category: 'compliance', result: scoreCompliance(building) },
    { category: 'construction_cost', result: scoreConstructionCost(building, context) },
    { category: 'natural_light', result: scoreNaturalLight(building) },
    { category: 'energy', result: scoreEnergy(building) },
    { category: 'circulation', result: scoreCirculation(building) },
    { category: 'privacy', result: scorePrivacy(building) },
    { category: 'resale', result: scoreResale(building) },
    { category: 'buildability', result: scoreBuildability(building) },
  ];

  const scores: OptimizationScore[] = scorers.map(({ category, result }) => ({
    category,
    score: result.score,
    weight: weights[category],
    explanation: result.explanation,
  }));

  const overall = computeOverallScore(scores, weights);
  scores.push({
    category: 'overall',
    score: overall,
    weight: 1,
    explanation: {
      summary: `Weighted overall score ${overall}/100 across ${CATEGORY_LABELS.compliance} through ${CATEGORY_LABELS.buildability}.`,
      metrics: { overall },
    },
  });

  return scores;
}

export function computeOverallScore(
  scores: OptimizationScore[],
  weights = getWeightProfile(),
): number {
  const categoryScores = scores.filter((s) => s.category !== 'overall');
  let total = 0;
  let weightSum = 0;
  for (const s of categoryScores) {
    const w = weights[s.category as Exclude<OptimizationScoreCategory, 'overall'>] ?? 0;
    total += s.score * w;
    weightSum += w;
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

export function rankCandidates(candidates: OptimizationCandidate[]): OptimizationCandidate[] {
  return [...candidates]
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export function buildBatchScoringContext(
  buildings: GeneratedBuilding[],
  targetBudget?: number,
): BatchScoringContext {
  const costs = buildings.map((b) => b.costSummary.total).sort((a, b) => a - b);
  const mid = Math.floor(costs.length / 2);
  const medianCost = costs.length % 2 === 0 ? (costs[mid - 1] + costs[mid]) / 2 : costs[mid];
  return { medianCost, targetBudget, batchSize: buildings.length };
}
