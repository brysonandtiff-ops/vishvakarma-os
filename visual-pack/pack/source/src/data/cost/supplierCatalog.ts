import type { SupplierQuote } from '@/domain/cost/types';
import { MATERIAL_CATALOG } from '@/data/cost/materialCatalog';

const SUPPLIERS = [
  { id: 'supplier-budget', name: 'BuildMart AU', tier: 'budget' as const, factor: 0.88 },
  { id: 'supplier-standard', name: 'TradeLink National', tier: 'standard' as const, factor: 1 },
  { id: 'supplier-premium', name: 'Premium Build Supply', tier: 'premium' as const, factor: 1.14 },
];

function buildQuotes(): SupplierQuote[] {
  const quotes: SupplierQuote[] = [];
  for (const entry of MATERIAL_CATALOG) {
    for (const supplier of SUPPLIERS) {
      quotes.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        sku: entry.sku,
        unitCost: Math.round(entry.baseUnitCost * supplier.factor * 100) / 100,
        leadTimeDays: supplier.tier === 'budget' ? 14 : supplier.tier === 'standard' ? 7 : 5,
        freshness: 'current',
        tier: supplier.tier,
      });
    }
  }
  return quotes;
}

export const SUPPLIER_QUOTES: SupplierQuote[] = buildQuotes();

export function getQuotesForSku(sku: string): SupplierQuote[] {
  return SUPPLIER_QUOTES.filter((quote) => quote.sku === sku);
}
