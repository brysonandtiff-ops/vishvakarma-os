import { LABOR_RATES_BY_TRADE } from '@/data/cost/laborRates';
import type { LaborBreakdownLine, PricedBomLine, RegionalCostIndex } from '@/domain/cost/types';
import { applyRegionalMultiplier } from '@/services/cost-estimation/regionalCostIndex';

export interface LaborCostResult {
  total: number;
  lines: LaborBreakdownLine[];
}

export function computeLaborCost(
  pricedLines: PricedBomLine[],
  region: RegionalCostIndex,
  productivityMultiplier = 1,
): LaborCostResult {
  const byTrade = new Map<string, { hours: number; tradeCode: LaborBreakdownLine['tradeCode'] }>();

  for (const line of pricedLines) {
    if (!line.sku || line.laborHours <= 0) continue;
    const entry = byTrade.get(line.sku) ?? { hours: 0, tradeCode: 'carpentry' };
    entry.hours += line.laborHours;
    byTrade.set(line.sku, entry);
  }

  const tradeHours = new Map<LaborBreakdownLine['tradeCode'], number>();
  for (const line of pricedLines) {
    if (line.laborHours <= 0) continue;
    const catalogEntry = line.sku;
    if (!catalogEntry) continue;
    const trade = inferTradeFromSku(catalogEntry);
    tradeHours.set(trade, (tradeHours.get(trade) ?? 0) + line.laborHours);
  }

  const lines: LaborBreakdownLine[] = [];
  let total = 0;

  for (const [tradeCode, hours] of tradeHours) {
    const rate = LABOR_RATES_BY_TRADE.get(tradeCode);
    if (!rate) continue;
    const adjustedHours = hours * productivityMultiplier;
    const hourly = applyRegionalMultiplier(rate.hourlyRate, region, 'labor');
    const amount = Math.round(adjustedHours * hourly * rate.productivityFactor);
    lines.push({
      tradeCode,
      label: rate.label,
      hours: Math.round(adjustedHours * 100) / 100,
      hourlyRate: hourly,
      amount,
    });
    total += amount;
  }

  return { total, lines };
}

function inferTradeFromSku(sku: string): LaborBreakdownLine['tradeCode'] {
  if (sku.includes('TIMBER')) return 'carpentry';
  if (sku.includes('CONCRETE-SLAB') || sku.includes('DRIVEWAY')) return 'concrete';
  if (sku.includes('DOOR') || sku.includes('WINDOW') || sku.includes('ALU')) return 'glazing';
  if (sku.includes('PLASTER')) return 'plaster';
  if (sku.includes('ROOF') || sku.includes('COLORBOND')) return 'roofing';
  return 'site';
}
