import { describe, expect, it } from 'vitest';
import { BOM_ITEM_TO_SKU, MATERIAL_CATALOG, MATERIAL_CATALOG_BY_SKU } from '@/data/cost/materialCatalog';

describe('materialCatalog', () => {
  it('covers all BOM generator item names', () => {
    const bomItems = [
      'Timber wall framing',
      'Concrete slab (100mm)',
      'External doors',
      'Aluminium windows',
      'Internal plasterboard',
      'Colorbond roofing',
      'Driveway concrete',
    ];
    for (const item of bomItems) {
      const sku = BOM_ITEM_TO_SKU[item];
      expect(sku).toBeTruthy();
      expect(MATERIAL_CATALOG_BY_SKU.has(sku)).toBe(true);
    }
  });

  it('has positive base costs and labor hours', () => {
    for (const entry of MATERIAL_CATALOG) {
      expect(entry.baseUnitCost).toBeGreaterThan(0);
      expect(entry.laborHoursPerUnit).toBeGreaterThan(0);
    }
  });
});
