import { BOM_ITEM_TO_SKU, MATERIAL_CATALOG_BY_SKU } from '@/data/cost/materialCatalog';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { MaterialCatalogEntry, RegionalCostIndex } from '@/domain/cost/types';

export function resolveSkuForBomRow(row: MaterialListRow): string | null {
  if (row.sku) return row.sku;
  return BOM_ITEM_TO_SKU[row.item] ?? null;
}

export function getCatalogEntry(sku: string): MaterialCatalogEntry | null {
  return MATERIAL_CATALOG_BY_SKU.get(sku) ?? null;
}

export function priceMaterialLine(
  sku: string,
  quantity: number,
  region: RegionalCostIndex,
): { materialCost: number; laborHours: number; entry: MaterialCatalogEntry } | null {
  const entry = getCatalogEntry(sku);
  if (!entry) return null;

  const unitCost = Math.round(entry.baseUnitCost * region.materialMultiplier * 100) / 100;
  const materialCost = Math.round(unitCost * quantity);
  const laborHours = Math.round(entry.laborHoursPerUnit * quantity * 100) / 100;

  return { materialCost, laborHours, entry };
}
