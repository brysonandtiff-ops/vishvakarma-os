import type { BuildingSchedules } from '@/domain/buildings/generatedBuilding';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { CostConfidenceReport, PricedBomLine, RegionalCostIndex } from '@/domain/cost/types';
import { DEFAULT_REGION_ID } from '@/data/cost/regionalIndices';
import { resolveSkuForBomRow } from '@/services/cost-estimation/materialDatabase';
import { countSupplierCoverage } from '@/services/cost-estimation/supplierPricingEngine';
import { getQuotesForSku } from '@/data/cost/supplierCatalog';

export function scoreCostConfidence(input: {
  materialList: MaterialListRow[];
  pricedLines: PricedBomLine[];
  region: RegionalCostIndex;
  schedules: BuildingSchedules;
}): CostConfidenceReport {
  const { materialList, pricedLines, region, schedules } = input;

  const catalogMatched = materialList.filter((row) => resolveSkuForBomRow(row)).length;
  const catalogCoverage =
    materialList.length > 0 ? Math.round((catalogMatched / materialList.length) * 100) : 0;

  const supplierStats = countSupplierCoverage(pricedLines);
  const supplierCoverage =
    supplierStats.total > 0
      ? Math.round((supplierStats.multiQuote / supplierStats.total) * 100)
      : 0;

  const regionalMatch = region.regionId !== DEFAULT_REGION_ID;

  let freshQuotes = 0;
  let totalQuotes = 0;
  for (const line of pricedLines) {
    if (!line.sku) continue;
    const quotes = getQuotesForSku(line.sku);
    totalQuotes += quotes.length;
    freshQuotes += quotes.filter((q) => q.freshness === 'current').length;
  }
  const dataFreshness =
    totalQuotes > 0 ? Math.round((freshQuotes / totalQuotes) * 100) : 0;

  const scheduleFields = [
    schedules.rooms.length > 0,
    schedules.walls.length > 0,
    schedules.windows.length > 0,
  ];
  const scheduleCompleteness = Math.round(
    (scheduleFields.filter(Boolean).length / scheduleFields.length) * 100,
  );

  const score = Math.round(
    catalogCoverage * 0.3 +
      supplierCoverage * 0.25 +
      (regionalMatch ? 100 : 40) * 0.2 +
      scheduleCompleteness * 0.15 +
      dataFreshness * 0.1,
  );

  const summary =
    score >= 70
      ? `High confidence (${score}/100) — ${catalogCoverage}% catalog coverage, ${supplierCoverage}% multi-supplier lines.`
      : score >= 50
        ? `Moderate confidence (${score}/100) — review missing SKUs or supplier gaps.`
        : `Low confidence (${score}/100) — limited pricing data; treat as indicative only.`;

  return {
    score,
    catalogCoverage,
    supplierCoverage,
    regionalMatch,
    dataFreshness,
    scheduleCompleteness,
    summary,
  };
}
