import type {
  OptimizationCandidate,
  OptimizationReport,
  OptimizationScoreCategory,
} from '@/domain/optimization/types';
import { getWeightProfile } from '@/services/optimization/scoring/weightProfiles';

export type DecisionBulletSource = 'tradeoff' | 'score' | 'moat' | 'risk';

export interface DecisionBullet {
  polarity: 'pro' | 'con';
  text: string;
  source: DecisionBulletSource;
}

const CATEGORY_LABELS: Record<Exclude<OptimizationScoreCategory, 'overall'>, string> = {
  compliance: 'Compliance',
  construction_cost: 'Construction cost',
  natural_light: 'Natural light',
  energy: 'Energy',
  circulation: 'Circulation',
  privacy: 'Privacy',
  resale: 'Resale value',
  buildability: 'Buildability',
};

const SCORE_DELTA_THRESHOLD = 5;

function topWeightedCategoryWin(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
): DecisionBullet | null {
  const weights = getWeightProfile(winner.objective);
  const winnerMap = new Map(
    winner.scores.filter((s) => s.category !== 'overall').map((s) => [s.category, s.score]),
  );
  const runnerMap = new Map(
    runnerUp.scores.filter((s) => s.category !== 'overall').map((s) => [s.category, s.score]),
  );

  let bestCategory: Exclude<OptimizationScoreCategory, 'overall'> | null = null;
  let bestWeightedDelta = 0;

  for (const [category, weight] of Object.entries(weights) as Array<
    [Exclude<OptimizationScoreCategory, 'overall'>, number]
  >) {
    const delta = (winnerMap.get(category) ?? 0) - (runnerMap.get(category) ?? 0);
    const weightedDelta = delta * weight;
    if (delta >= SCORE_DELTA_THRESHOLD && weightedDelta > bestWeightedDelta) {
      bestCategory = category;
      bestWeightedDelta = weightedDelta;
    }
  }

  if (!bestCategory) return null;

  const label = CATEGORY_LABELS[bestCategory];
  const w = winnerMap.get(bestCategory) ?? 0;
  const r = runnerMap.get(bestCategory) ?? 0;

  return {
    polarity: 'pro',
    text: `Strongest ${label.toLowerCase()} score among candidates (${w} vs ${r} runner-up).`,
    source: 'score',
  };
}

export function buildDecisionBullets(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
  report: OptimizationReport,
): DecisionBullet[] {
  const bullets: DecisionBullet[] = [];

  const improvingTradeoffs = report.tradeoffs.filter((t) => t.direction === 'improves');
  for (const tradeoff of improvingTradeoffs.slice(0, 3)) {
    bullets.push({
      polarity: 'pro',
      text: tradeoff.detail,
      source: 'tradeoff',
    });
  }

  const weightedWin = topWeightedCategoryWin(winner, runnerUp);
  if (weightedWin) {
    bullets.push(weightedWin);
  }

  const worseningTradeoffs = report.tradeoffs.filter((t) => t.direction === 'worsens');
  for (const tradeoff of worseningTradeoffs.slice(0, 2)) {
    bullets.push({
      polarity: 'con',
      text: tradeoff.detail,
      source: 'tradeoff',
    });
  }

  if (report.riskAreas.length > 0) {
    bullets.push({
      polarity: 'con',
      text: report.riskAreas[0],
      source: 'risk',
    });
  }

  if (!report.permitReady) {
    bullets.push({
      polarity: 'con',
      text: 'Permit blocked — compliance failures require resolution before export.',
      source: 'risk',
    });
  }

  return bullets;
}

export function buildDecisionHeadline(report: OptimizationReport): string {
  return report.moatGain.summary;
}
