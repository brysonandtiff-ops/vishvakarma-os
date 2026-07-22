import type { CostIntelligenceReport } from '@/domain/cost/types';
import type {
  MoatGainReport,
  OptimizationCandidate,
  ValueImpactBand,
  ValueImpactLabel,
} from '@/domain/optimization/types';
import { analyzeCostMoat } from '@/services/cost-estimation/costMoatAnalyzer';

const MOAT_THRESHOLD = 45;

const DECISION_WEIGHTS = {
  decisionLift: 0.18,
  winnerMargin: 0.18,
  strategyDiversity: 0.14,
  permitConfidence: 0.1,
  explainabilityIndex: 0.1,
} as const;

const COST_WEIGHTS = {
  costConfidence: 0.15,
  pricingDefensibility: 0.15,
} as const;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function normalizeSignal(value: number, scale: number): number {
  return Math.min(100, Math.max(0, Math.round(value * scale)));
}

function computeStrategyDiversity(candidates: OptimizationCandidate[]): number {
  const scores = candidates.map((c) => c.overallScore);
  if (scores.length < 2) return 0;
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  return normalizeSignal(Math.sqrt(variance), 5);
}

function computeExplainabilityIndex(candidate: OptimizationCandidate): number {
  const categoryScores = candidate.scores.filter((s) => s.category !== 'overall');
  if (categoryScores.length === 0) return 0;
  const explained = categoryScores.filter(
    (s) => Object.keys(s.explanation.metrics).length > 0,
  ).length;
  return Math.round((explained / categoryScores.length) * 100);
}

function valueImpactFromScore(score: number): {
  valueImpactBand: ValueImpactBand;
  valueImpactLabel: ValueImpactLabel;
} {
  if (score >= MOAT_THRESHOLD) {
    return { valueImpactBand: 'defensible', valueImpactLabel: '$3M–8M' };
  }
  return { valueImpactBand: 'foundation', valueImpactLabel: '$1M–3M' };
}

function buildSummary(
  score: number,
  decisionLift: number,
  winnerMargin: number,
  valueImpactLabel: ValueImpactLabel,
  costMoat?: MoatGainReport['costMoat'],
): string {
  const decisionPart =
    score >= MOAT_THRESHOLD
      ? `Optimization moat active (${valueImpactLabel}). Winner leads by ${winnerMargin} pts with ${decisionLift} pt lift.`
      : `Generator territory (${valueImpactLabel}). Multi-candidate spread is limited.`;

  if (!costMoat) return decisionPart;
  return `${decisionPart} ${costMoat.summary}`;
}

export function analyzeMoatGain(
  candidates: OptimizationCandidate[],
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
  permitReady: boolean,
  costIntelligence?: CostIntelligenceReport,
  approvalScore?: number,
): MoatGainReport {
  const overallScores = candidates.map((c) => c.overallScore);
  const batchMedian = median(overallScores);
  const decisionLift = Math.round(winner.overallScore - batchMedian);
  const winnerMargin = Math.round(winner.overallScore - runnerUp.overallScore);

  const complianceScore =
    winner.scores.find((s) => s.category === 'compliance')?.score ?? 0;
  const councilApproval =
    approvalScore ??
    winner.building.councilAssessment?.approvalScore ??
    winner.building.copilot?.councilAssessment?.approvalScore;
  const permitConfidence = permitReady
    ? councilApproval != null
      ? Math.round(complianceScore * 0.4 + councilApproval * 0.6)
      : complianceScore
    : 0;

  const explainabilityScores = candidates.map(computeExplainabilityIndex);
  const explainabilityIndex = Math.round(
    explainabilityScores.reduce((sum, s) => sum + s, 0) / explainabilityScores.length,
  );

  const normalizedDecision = {
    decisionLift: normalizeSignal(decisionLift, 5),
    winnerMargin: normalizeSignal(winnerMargin, 10),
    strategyDiversity: computeStrategyDiversity(candidates),
    permitConfidence,
    explainabilityIndex,
  };

  const decisionScore = Math.round(
    normalizedDecision.decisionLift * DECISION_WEIGHTS.decisionLift +
      normalizedDecision.winnerMargin * DECISION_WEIGHTS.winnerMargin +
      normalizedDecision.strategyDiversity * DECISION_WEIGHTS.strategyDiversity +
      normalizedDecision.permitConfidence * DECISION_WEIGHTS.permitConfidence +
      normalizedDecision.explainabilityIndex * DECISION_WEIGHTS.explainabilityIndex,
  );

  const costMoat = analyzeCostMoat(costIntelligence ?? winner.building.costSummary.intelligence);

  let compositeScore = decisionScore;
  if (costMoat) {
    const costComponent = Math.round(
      costMoat.costConfidence * COST_WEIGHTS.costConfidence +
        costMoat.pricingDefensibility * COST_WEIGHTS.pricingDefensibility,
    );
    compositeScore = Math.round(decisionScore * 0.7 + costComponent * 0.3 + costMoat.score * 0.15);
    compositeScore = Math.min(100, compositeScore);
  }

  const { valueImpactBand, valueImpactLabel } = valueImpactFromScore(decisionScore);

  return {
    score: decisionScore,
    compositeScore,
    decisionLift,
    winnerMargin,
    strategyDiversity: normalizedDecision.strategyDiversity,
    permitConfidence,
    explainabilityIndex,
    valueImpactBand,
    valueImpactLabel,
    costMoat,
    summary: buildSummary(decisionScore, decisionLift, winnerMargin, valueImpactLabel, costMoat),
  };
}
