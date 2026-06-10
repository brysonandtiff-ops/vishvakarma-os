import type {
  OptimizationCandidate,
  OptimizationReport,
  TradeoffItem,
} from '@/domain/optimization/types';
import { PRIMARY_DIMENSIONS, PRIMARY_DIMENSION_LABELS, toDisplayScores } from '@/services/optimization/displayDimensions';
import { analyzeMoatGain } from '@/services/optimization/moatGainAnalyzer';

const DELTA_THRESHOLD = 5;

export function analyzeTradeoffs(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
): TradeoffItem[] {
  const winnerDisplay = toDisplayScores(winner.scores);
  const runnerDisplay = toDisplayScores(runnerUp.scores);
  const winnerMap = new Map(winnerDisplay.map((s) => [s.dimension, s]));
  const runnerMap = new Map(runnerDisplay.map((s) => [s.dimension, s]));

  return PRIMARY_DIMENSIONS.map((dimension) => {
    const label = PRIMARY_DIMENSION_LABELS[dimension];
    const w = winnerMap.get(dimension)?.score ?? 0;
    const r = runnerMap.get(dimension)?.score ?? 0;
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

    return { dimension: label, direction, detail };
  });
}

export function identifyRiskAreas(candidate: OptimizationCandidate): string[] {
  const risks: string[] = [];
  const display = toDisplayScores(candidate.scores);
  const compliance = display.find((s) => s.dimension === 'compliance');
  const cost = display.find((s) => s.dimension === 'cost');
  const buildability = display.find((s) => s.dimension === 'buildability');
  const energy = display.find((s) => s.dimension === 'energy');

  if (candidate.building.complianceReport.blocked) {
    risks.push('Compliance failures block permit export.');
  } else if (compliance && compliance.score < 80) {
    risks.push('Compliance warnings may require surveyor review.');
  }

  const councilAssessment =
    candidate.building.councilAssessment ?? candidate.building.copilot?.councilAssessment;
  if (councilAssessment) {
    if (councilAssessment.likelihood === 'low') {
      risks.push(`Low council approval likelihood (${councilAssessment.approvalScore}%).`);
    }
    for (const blocker of councilAssessment.blockers.slice(0, 2)) {
      risks.push(`Council blocker: ${blocker}`);
    }
  }

  if (cost && cost.score < 60) {
    risks.push('Construction cost exceeds target or batch median.');
  }

  const intelligence = candidate.building.costSummary.intelligence;
  if (intelligence) {
    const { scenarios, confidence, risk } = intelligence;
    risks.push(
      `Cost band: $${scenarios.bestCase.toLocaleString()} – $${scenarios.worstCase.toLocaleString()} (expected $${scenarios.expected.toLocaleString()}).`,
    );
    if (confidence.score < 60) {
      risks.push(`Low cost confidence (${confidence.score}/100) — ${confidence.summary}`);
    }
    if (risk.level === 'high') {
      risks.push(`High cost risk — ${risk.drivers[0]}`);
    }
  }

  if (buildability && buildability.score < 55) {
    risks.push('High construction complexity may increase build timeline.');
  }

  if (energy && energy.score < 50) {
    risks.push('Low thermal comfort score — consider glazing or insulation upgrades.');
  }

  return risks;
}

export function buildOptimizationReport(
  winner: OptimizationCandidate,
  runnerUp: OptimizationCandidate,
  allCandidates: OptimizationCandidate[],
): OptimizationReport {
  const complianceScore = winner.scores.find((s) => s.category === 'compliance')?.score ?? 0;
  const approvalConfidence =
    winner.building.councilAssessment?.approvalScore ??
    winner.building.copilot?.councilAssessment?.approvalScore ??
    complianceScore;
  const permitReady = !winner.building.complianceReport.blocked;

  return {
    winnerId: winner.id,
    runnerUpId: runnerUp.id,
    winnerLabel: winner.label,
    runnerUpLabel: runnerUp.label,
    tradeoffs: analyzeTradeoffs(winner, runnerUp),
    riskAreas: identifyRiskAreas(winner),
    estimatedCost: winner.building.costSummary.total,
    complianceConfidence: complianceScore,
    approvalConfidence,
    permitReady,
    moatGain: analyzeMoatGain(
      allCandidates,
      winner,
      runnerUp,
      permitReady,
      winner.building.costSummary.intelligence,
      approvalConfidence,
    ),
    generatedAt: new Date().toISOString(),
  };
}
