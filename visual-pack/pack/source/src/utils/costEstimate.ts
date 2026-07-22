import type { CostItem, ProjectManifest } from '@/types';

const MATERIAL_RATES: Record<string, number> = {
  'material-paint': 12,
  'material-wood': 28,
  'material-concrete': 18,
};

const OPENING_UNIT_COST = 450;
const FURNITURE_UNIT_COST = 220;
const MEP_UNIT_COST = 85;
const LANDSCAPE_UNIT_COST = 120;

export function calculateProjectCostItems(manifest: ProjectManifest): CostItem[] {
  const items: CostItem[] = [];

  let wallTotal = 0;
  for (const wall of manifest.walls) {
    const lengthPx = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const meters = lengthPx / (manifest.gridSize || 20);
    const rate = MATERIAL_RATES[wall.material] ?? 15;
    wallTotal += meters * rate;
  }

  if (wallTotal > 0) {
    items.push({
      id: 'cost-walls',
      label: 'Wall materials',
      amount: Math.round(wallTotal),
    });
  }

  if (manifest.openings.length > 0) {
    items.push({
      id: 'cost-openings',
      label: 'Doors & windows',
      amount: manifest.openings.length * OPENING_UNIT_COST,
    });
  }

  const furnitureCount = manifest.furniture?.length ?? 0;
  if (furnitureCount > 0) {
    items.push({
      id: 'cost-furniture',
      label: 'Furniture',
      amount: furnitureCount * FURNITURE_UNIT_COST,
    });
  }

  const mepCount = manifest.mepSymbols?.length ?? 0;
  if (mepCount > 0) {
    items.push({
      id: 'cost-mep',
      label: 'MEP symbols',
      amount: mepCount * MEP_UNIT_COST,
    });
  }

  const landscapeCount = manifest.landscapeElements?.length ?? 0;
  if (landscapeCount > 0) {
    items.push({
      id: 'cost-landscape',
      label: 'Landscape',
      amount: landscapeCount * LANDSCAPE_UNIT_COST,
    });
  }

  return items;
}

export function sumCostItems(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

const COST_FIELDS: (keyof ProjectManifest)[] = [
  'walls',
  'openings',
  'furniture',
  'mepSymbols',
  'landscapeElements',
  'materials',
  'fixtures',
  'staircases',
  'floors',
  'terrain',
  'rooms',
  'roofs',
  'plumbingRuns',
  'ceilingZones',
];

export function partialTouchesCost(partial: Partial<ProjectManifest>): boolean {
  return COST_FIELDS.some((key) => key in partial && partial[key] !== undefined);
}
