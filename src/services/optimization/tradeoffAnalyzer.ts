import type {
  OptimizationCandidate,
  OptimizationReport,
  OptimizationScoreCategory,
  TradeoffItem,
} from '@/domain/optimization/types';

const CATEGORY_LABELS: Record<Exclude<OptimizationScoreCategory, 'overall'>, string> = {
  compliance: 'Compliance',
  construction_cost: 'Construction cost',
  natural_light: 'Natural light',
  energy: 'Energy performance',
  circulation: 'Circulation',
  privacy: 'Privacy',
  resale: 'Resale appeal',
  buildability: 'Buildability',
};

const DELTA_THRESHOLD = 5;

export function analyzeTradeoffs(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
): TradeoffItem[] {
  const items: TradeoffItem[] = [];
  const winnerScores = new Map(winner.scores.map((s) => [s.category, s]));
  const runnerScores = new Map(runnerUp.scores.map((s) => [s.category, s]));

  for (const [category, label] of Object.entries(CATEGORY_LABELS) as Array<
    [Exclude<OptimizationScoreCategory, 'overall'>, string]
  >) {
    const w = winnerScores.get(category)?.score ?? 0;
    const r = runnerScores.get(category)?.score ?? 0;
    const delta = w - r;

    let direction: TradeoffItem['direction'];
    if (delta > DELTA_THRESHOLD) direction = 'improves';
    else if (delta < -DELTA_THRESHOLD) direction = 'worsens';
    else direction = 'unchanged';

    const detail =
      direction === 'unchanged'
        ? `${label} is comparable (${w} vs ${r}).`
        : direction === 'improves'
          ? `${label} improves by ${delta} points (${w} vs ${r}).`
          : `${label} is ${Math.abs(delta)} points lower (${w} vs ${r}).`;

    items.push({ dimension: label, direction, detail });
  }

  return items;
}

export function identifyRiskAreas(candidate: OptimizationCandidate): string[] {
  const risks: string[] = [];
  const compliance = candidate.scores.find((s) => s.category === 'compliance');
  const cost = candidate.scores.find((s) => s.category === 'construction_cost');
  const buildability = candidate.scores.find((s) => s.category === 'buildability');

  if (candidate.building.complianceReport.blocked) {
    risks.push('Compliance failures block permit export.');
  } else if (compliance && compliance.score < 80) {
    risks.push('Compliance warnings may require surveyor review.');
  }

  if (cost && cost.score < 60) {
    risks.push('Construction cost exceeds target or batch median.');
  }

  if (buildability && buildability.score < 55) {
    risks.push('High construction complexity may increase build timeline.');
  }

  const energy = candidate.scores.find((s) => s.category === 'energy');
  if (energy && energy.score < 50) {
    risks.push('Low thermal comfort score — consider glazing or insulation upgrades.');
  }

  return risks;
}

export function buildOptimizationReport(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
): OptimizationReport {
  const complianceScore = winner.scores.find((s) => s.category === 'compliance')?.score ?? 0;

  return {
    winnerId: winner.id,
    runnerUpId: runnerUp.id,
    winnerLabel: winner.label,
    runnerUpLabel: runnerUp.label,
    tradeoffs: analyzeTradeoffs(winner, runnerUp),
    riskAreas: identifyRiskAreas(winner),
    estimatedCost: winner.building.costSummary.total,
    complianceConfidence: complianceScore,
    permitReady: !winner.building.complianceReport.blocked,
    generatedAt: new Date().toISOString(),
  };
}
