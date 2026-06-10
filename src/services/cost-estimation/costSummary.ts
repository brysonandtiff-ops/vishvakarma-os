import type { CostSummary } from '@/domain/buildings/generatedBuilding';
import { calculateProjectCostItems, sumCostItems } from '@/utils/costEstimate';
import type { ProjectManifest } from '@/types';

export function buildCostSummary(manifest: ProjectManifest): CostSummary {
  const items = calculateProjectCostItems(manifest);
  return {
    total: sumCostItems(items),
    items: items.map((item) => ({ id: item.id, label: item.label, amount: item.amount })),
  };
}
