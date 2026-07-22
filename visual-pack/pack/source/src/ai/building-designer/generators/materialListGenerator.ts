import type { GeneratedFloorPlan } from '@/domain/buildings/generatedBuilding';
import type { BuildingSchedules } from '@/domain/buildings/generatedBuilding';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import { PX_PER_METER } from '@/domain/constants';

function pxToM(px: number) {
  return Math.round((px / PX_PER_METER) * 100) / 100;
}

export function generateMaterialList(
  floorPlan: GeneratedFloorPlan,
  schedules: BuildingSchedules,
): MaterialListRow[] {
  const items: MaterialListRow[] = [];
  let id = 0;
  const nextId = () => `mat-${++id}`;

  const totalWallLength = schedules.walls.reduce((sum, w) => sum + w.lengthM, 0);
  items.push({
    id: nextId(),
    category: 'structure',
    item: 'Timber wall framing',
    sku: 'SKU-TIMBER-FRAMING',
    quantity: Math.ceil(totalWallLength * 2.4),
    unit: 'lm',
    notes: 'Stud walls at 450mm centres',
  });

  items.push({
    id: nextId(),
    category: 'structure',
    item: 'Concrete slab (100mm)',
    sku: 'SKU-CONCRETE-SLAB-100',
    quantity: Math.round(
      floorPlan.rooms.reduce((sum, r) => sum + pxToM(r.width) * pxToM(r.depth), 0) * 10,
    ) / 10,
    unit: 'm²',
  });

  const doorCount = floorPlan.openings.filter((o) => o.type === 'door').length;
  const windowCount = floorPlan.openings.filter((o) => o.type === 'window').length;

  items.push({
    id: nextId(),
    category: 'openings',
    item: 'External doors',
    sku: 'SKU-EXTERNAL-DOOR',
    quantity: doorCount,
    unit: 'ea',
  });

  items.push({
    id: nextId(),
    category: 'openings',
    item: 'Aluminium windows',
    sku: 'SKU-ALU-WINDOW',
    quantity: windowCount,
    unit: 'ea',
  });

  items.push({
    id: nextId(),
    category: 'finish',
    item: 'Internal plasterboard',
    sku: 'SKU-PLASTERBOARD',
    quantity: Math.ceil(totalWallLength * 2.4 * 2),
    unit: 'm²',
  });

  items.push({
    id: nextId(),
    category: 'roof',
    item: 'Colorbond roofing',
    sku: 'SKU-COLORBOND-ROOF',
    quantity: Math.round(
      floorPlan.rooms.reduce((sum, r) => sum + pxToM(r.width) * pxToM(r.depth), 0) * 1.15 * 10,
    ) / 10,
    unit: 'm²',
  });

  items.push({
    id: nextId(),
    category: 'site',
    item: 'Driveway concrete',
    sku: 'SKU-DRIVEWAY-CONCRETE',
    quantity: requestDrivewayArea(floorPlan),
    unit: 'm²',
  });

  return items;
}

function requestDrivewayArea(floorPlan: GeneratedFloorPlan): number {
  const garage = floorPlan.rooms.find((r) => r.type === 'Garage');
  if (!garage) return 12;
  return Math.round(pxToM(garage.width) * pxToM(garage.depth) * 1.4 * 10) / 10;
}
