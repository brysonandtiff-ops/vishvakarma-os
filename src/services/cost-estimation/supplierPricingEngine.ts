import { getQuotesForSku } from '@/data/cost/supplierCatalog';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { PricedBomLine, SupplierStrategy } from '@/domain/cost/types';
import { getCatalogEntry, priceMaterialLine, resolveSkuForBomRow } from '@/services/cost-estimation/materialDatabase';
import type { RegionalCostIndex } from '@/domain/cost/types';

function pickUnitCost(costs: number[], strategy: SupplierStrategy): number {
  const sorted = [...costs].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  if (strategy === 'best_price') return sorted[0];
  if (strategy === 'premium') return sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function priceBomLines(
  materialList: MaterialListRow[],
  region: RegionalCostIndex,
  strategy: SupplierStrategy,
): PricedBomLine[] {
  return materialList.map((row) => {
    const sku = resolveSkuForBomRow(row);
    if (!sku) {
      return {
        rowId: row.id,
        sku: null,
        item: row.item,
        quantity: row.quantity,
        unit: row.unit,
        unitCost: 0,
        lineTotal: 0,
        supplierId: null,
        laborHours: 0,
        laborCost: 0,
      };
    }

    const quotes = getQuotesForSku(sku);
    const unitCosts = quotes.map((q) => q.unitCost);
    const unitCost = pickUnitCost(unitCosts, strategy);
    const priced = priceMaterialLine(sku, row.quantity, region);
    const entry = getCatalogEntry(sku);
    const supplier =
      quotes.find((q) => q.unitCost === unitCost) ??
      quotes[Math.floor(quotes.length / 2)] ??
      null;

    const materialCost =
      strategy === 'best_price'
        ? Math.round(unitCost * row.quantity)
        : priced?.materialCost ?? Math.round(unitCost * row.quantity);

    return {
      rowId: row.id,
      sku,
      item: row.item,
      quantity: row.quantity,
      unit: row.unit,
      unitCost,
      lineTotal: materialCost,
      supplierId: supplier?.supplierId ?? null,
      laborHours: priced?.laborHours ?? (entry ? entry.laborHoursPerUnit * row.quantity : 0),
      laborCost: 0,
    };
  });
}

export function countSupplierCoverage(pricedLines: PricedBomLine[]): {
  covered: number;
  total: number;
  multiQuote: number;
} {
  let covered = 0;
  let multiQuote = 0;
  for (const line of pricedLines) {
    if (!line.sku) continue;
    const quotes = getQuotesForSku(line.sku);
    if (quotes.length > 0) covered += 1;
    if (quotes.length >= 2) multiQuote += 1;
  }
  return { covered, total: pricedLines.length, multiQuote };
}
