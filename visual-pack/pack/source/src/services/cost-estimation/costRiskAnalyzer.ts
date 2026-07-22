import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type {
  CostConfidenceReport,
  CostRiskLevel,
  CostRiskReport,
  CostScenarioBreakdown,
  RegionalCostIndex,
} from '@/domain/cost/types';

export function analyzeCostRisk(input: {
  scenarios: CostScenarioBreakdown;
  confidence: CostConfidenceReport;
  region: RegionalCostIndex;
  request: BuildingRequest;
  targetBudget?: number;
}): CostRiskReport {
  const { scenarios, confidence, region, request, targetBudget } = input;
  const varianceBand = scenarios.worstCase - scenarios.bestCase;
  const variancePct =
    scenarios.expected > 0 ? Math.round((varianceBand / scenarios.expected) * 100) : 0;

  const drivers: string[] = [];

  if (variancePct > 20) {
    drivers.push(`Wide supplier spread — ${variancePct}% variance between best and worst case.`);
  }
  if (confidence.catalogCoverage < 100) {
    drivers.push(`${100 - confidence.catalogCoverage}% of BOM lines missing catalog match.`);
  }
  if (!confidence.regionalMatch) {
    drivers.push('Regional index defaulted to national baseline — metro pricing may differ.');
  }
  if (region.volatility > 0.15) {
    drivers.push('Elevated regional volatility index increases worst-case contingency.');
  }
  if (request.parcel.slope > 5) {
    drivers.push('Slope > 5% increases site works contingency.');
  }
  if (targetBudget && scenarios.expected > targetBudget * 1.15) {
    drivers.push(
      `Expected cost exceeds target budget by ${Math.round(((scenarios.expected - targetBudget) / targetBudget) * 100)}%.`,
    );
  }

  let level: CostRiskLevel = 'low';
  if (
    variancePct > 25 ||
    confidence.score < 50 ||
    (targetBudget && scenarios.expected > targetBudget * 1.15)
  ) {
    level = 'high';
  } else if (variancePct > 15 || confidence.score < 70) {
    level = 'medium';
  }

  const contingencyPct =
    level === 'high' ? 15 : level === 'medium' ? 10 : 5;

  return {
    level,
    contingencyPct,
    drivers: drivers.length ? drivers : ['Cost variance within acceptable band for current data coverage.'],
    varianceBand,
  };
}
