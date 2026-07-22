import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { LayoutCandidate, PlanExplanation, PlanScore, PlanningMetadata } from '@/planning/types';

const DIMENSION_LABELS: Record<keyof PlanScore['dimensions'], string> = {
  compliance: 'Compliance margin',
  adjacency: 'Room adjacency',
  zoningMargin: 'Zoning headroom',
  programFit: 'Program fit',
  costEfficiency: 'Cost efficiency',
  circulation: 'Circulation',
};

export function selectBestCandidate(
  scores: PlanScore[],
  candidates: LayoutCandidate[],
): { winner: PlanScore; winnerCandidate: LayoutCandidate; ranked: PlanScore[] } {
  const ranked = [...scores].sort((a, b) => b.total - a.total);
  const winner = ranked.find((s) => s.total !== -Infinity) ?? ranked[0];
  const winnerCandidate = candidates.find((c) => c.id === winner.candidateId) ?? candidates[0];

  return { winner, winnerCandidate, ranked };
}

export function buildPlanExplanation(
  ranked: PlanScore[],
  selectedId: string,
): PlanExplanation {
  const winner = ranked.find((s) => s.candidateId === selectedId) ?? ranked[0];
  const runnerUp = ranked.find((s) => s.candidateId !== selectedId && s.total !== -Infinity);

  const winningReasons: string[] = [];
  for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
    const dimKey = key as keyof PlanScore['dimensions'];
    const value = winner.dimensions[dimKey];
    if (value >= 75) {
      winningReasons.push(`${label} scored ${Math.round(value)}/100`);
    }
  }

  for (const highlight of winner.highlights.slice(0, 3)) {
    winningReasons.push(highlight);
  }

  if (winningReasons.length === 0) {
    winningReasons.push(`Highest overall planning score (${Math.round(winner.total)}/100)`);
  }

  const tradeoffs: string[] = [];
  if (runnerUp) {
    for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
      const dimKey = key as keyof PlanScore['dimensions'];
      const delta = winner.dimensions[dimKey] - runnerUp.dimensions[dimKey];
      if (delta >= 10) {
        tradeoffs.push(`Runner-up scored lower on ${label.toLowerCase()} (−${Math.round(delta)} pts)`);
      }
    }
    if (tradeoffs.length === 0) {
      tradeoffs.push(`Runner-up (${runnerUp.candidateId}) was close but lost on overall weighted score`);
    }
  }

  const dimensionComparison: Record<string, number> = {};
  const medianByDimension: Partial<Record<keyof PlanScore['dimensions'], number>> = {};
  for (const key of Object.keys(DIMENSION_LABELS) as Array<keyof PlanScore['dimensions']>) {
    const values = ranked.map((s) => s.dimensions[key]).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    medianByDimension[key] =
      values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    dimensionComparison[key] = winner.dimensions[key] - (medianByDimension[key] ?? 0);
  }

  const topReason = winningReasons[0] ?? 'Best overall planning score';
  const summary = runnerUp
    ? `Selected ${winner.candidateId} from ${ranked.length} evaluated options. ${topReason} vs runner-up ${runnerUp.candidateId}.`
    : `Selected ${winner.candidateId} from ${ranked.length} evaluated options. ${topReason}.`;

  return {
    summary,
    winningReasons,
    tradeoffs,
    dimensionComparison,
  };
}

export function buildPlanningMetadata(
  ranked: PlanScore[],
  explanation: PlanExplanation,
  selectedId: string,
  candidateCount: number,
  evaluatedCount: number,
  shortlistedCount: number,
): PlanningMetadata {
  return {
    candidateCount,
    evaluatedCount,
    shortlistedCount,
    rankedScores: ranked,
    explanation,
    selectedCandidateId: selectedId,
    generatedAt: new Date().toISOString(),
  };
}

export function attachPlanningToBuilding(
  building: GeneratedBuilding,
  planning: PlanningMetadata,
  shortlist: GeneratedBuilding[],
): GeneratedBuilding {
  const withPlanning: GeneratedBuilding = {
    ...building,
    planning,
    shortlistBuildings: shortlist,
  };

  if (withPlanning.manifest.metadata.copilot && typeof withPlanning.manifest.metadata.copilot === 'object') {
    withPlanning.manifest.metadata.copilot = {
      ...(withPlanning.manifest.metadata.copilot as Record<string, unknown>),
      planning,
    };
  }

  return withPlanning;
}

export function findCandidateById(
  candidates: LayoutCandidate[],
  id: string,
): LayoutCandidate | undefined {
  return candidates.find((c) => c.id === id);
}
