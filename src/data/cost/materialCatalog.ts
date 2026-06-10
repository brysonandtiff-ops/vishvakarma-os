import type { MaterialCatalogEntry } from '@/domain/cost/types';

export const MATERIAL_CATALOG: MaterialCatalogEntry[] = [
  {
    sku: 'SKU-TIMBER-FRAMING',
    name: 'Timber wall framing',
    category: 'structure',
    unit: 'lm',
    baseUnitCost: 18,
    laborHoursPerUnit: 0.12,
    tradeCode: 'carpentry',
  },
  {
    sku: 'SKU-CONCRETE-SLAB-100',
    name: 'Concrete slab (100mm)',
    category: 'structure',
    unit: 'm²',
    baseUnitCost: 95,
    laborHoursPerUnit: 0.45,
    tradeCode: 'concrete',
  },
  {
    sku: 'SKU-EXTERNAL-DOOR',
    name: 'External doors',
    category: 'openings',
    unit: 'ea',
    baseUnitCost: 850,
    laborHoursPerUnit: 2.5,
    tradeCode: 'glazing',
  },
  {
    sku: 'SKU-ALU-WINDOW',
    name: 'Aluminium windows',
    category: 'openings',
    unit: 'ea',
    baseUnitCost: 620,
    laborHoursPerUnit: 1.8,
    tradeCode: 'glazing',
  },
  {
    sku: 'SKU-PLASTERBOARD',
    name: 'Internal plasterboard',
    category: 'finish',
    unit: 'm²',
    baseUnitCost: 28,
    laborHoursPerUnit: 0.22,
    tradeCode: 'plaster',
  },
  {
    sku: 'SKU-COLORBOND-ROOF',
    name: 'Colorbond roofing',
    category: 'roof',
    unit: 'm²',
    baseUnitCost: 72,
    laborHoursPerUnit: 0.35,
    tradeCode: 'roofing',
  },
  {
    sku: 'SKU-DRIVEWAY-CONCRETE',
    name: 'Driveway concrete',
    category: 'site',
    unit: 'm²',
    baseUnitCost: 68,
    laborHoursPerUnit: 0.4,
    tradeCode: 'site',
  },
];

export const MATERIAL_CATALOG_BY_SKU = new Map(
  MATERIAL_CATALOG.map((entry) => [entry.sku, entry]),
);

export const BOM_ITEM_TO_SKU: Record<string, string> = {
  'Timber wall framing': 'SKU-TIMBER-FRAMING',
  'Concrete slab (100mm)': 'SKU-CONCRETE-SLAB-100',
  'External doors': 'SKU-EXTERNAL-DOOR',
  'Aluminium windows': 'SKU-ALU-WINDOW',
  'Internal plasterboard': 'SKU-PLASTERBOARD',
  'Colorbond roofing': 'SKU-COLORBOND-ROOF',
  'Driveway concrete': 'SKU-DRIVEWAY-CONCRETE',
};
