import type { CostIntelligenceReport, CostMoatReport, CostValueImpactBand, CostValueImpactLabel } from '@/domain/cost/types';

const COST_MOAT_THRESHOLD = 55;

function valueImpactFromCostScore(score: number): {
  valueImpactBand: CostValueImpactBand;
  valueImpactLabel: CostValueImpactLabel;
} {
  if (score >= COST_MOAT_THRESHOLD) {
    return { valueImpactBand: 'cost_defensible', valueImpactLabel: '$10M–25M' };
  }
  return { valueImpactBand: 'cost_foundation', valueImpactLabel: '$5M–15M' };
}

export function analyzeCostMoat(intelligence?: CostIntelligenceReport): CostMoatReport | undefined {
  if (!intelligence) return undefined;

  const { confidence, risk, scenarios } = intelligence;
  const variancePct =
    scenarios.expected > 0
      ? Math.round(((scenarios.worstCase - scenarios.bestCase) / scenarios.expected) * 100)
      : 0;

  const pricingDefensibility = Math.round(
    confidence.supplierCoverage * 0.5 +
      confidence.catalogCoverage * 0.3 +
      (100 - Math.min(variancePct, 40)) * 0.2,
  );

  const score = Math.round(confidence.score * 0.6 + pricingDefensibility * 0.4);
  const { valueImpactBand, valueImpactLabel } = valueImpactFromCostScore(score);

  const summary =
    score >= COST_MOAT_THRESHOLD
      ? `Cost pricing moat active (${valueImpactLabel}). ${confidence.score}% confidence with ${pricingDefensibility}% pricing defensibility.`
      : `Indicative cost territory (${valueImpactLabel}). Confidence ${confidence.score}/100 — ${risk.level} risk.`;

  return {
    score,
    costConfidence: confidence.score,
    pricingDefensibility,
    valueImpactBand,
    valueImpactLabel,
    summary,
  };
}
