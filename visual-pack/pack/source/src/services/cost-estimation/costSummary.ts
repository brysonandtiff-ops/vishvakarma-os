import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { BuildingSchedules } from '@/domain/buildings/generatedBuilding';
import type { CostSummary } from '@/domain/buildings/generatedBuilding';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { buildCostIntelligence } from '@/services/cost-estimation/costIntelligenceOrchestrator';
import { calculateProjectCostItems, sumCostItems } from '@/utils/costEstimate';
import type { ProjectManifest } from '@/types';

export interface CostBuildContext {
  materialList?: MaterialListRow[];
  schedules?: BuildingSchedules;
  request?: BuildingRequest;
  council?: CouncilRequirements;
  targetBudget?: number;
}

function mapBreakdownToItems(
  intelligence: NonNullable<CostSummary['intelligence']>,
): CostSummary['items'] {
  return intelligence.scenarios.breakdown.map((line) => ({
    id: `cost-${line.id}`,
    label: line.label,
    amount: line.amount,
  }));
}

export function buildCostSummary(manifest: ProjectManifest, context?: CostBuildContext): CostSummary {
  if (!context?.materialList || !context.schedules || !context.request) {
    const items = calculateProjectCostItems(manifest);
    return {
      total: sumCostItems(items),
      items: items.map((item) => ({ id: item.id, label: item.label, amount: item.amount })),
    };
  }

  const intelligence = buildCostIntelligence({
    manifest,
    materialList: context.materialList,
    schedules: context.schedules,
    request: context.request,
    council: context.council,
    targetBudget: context.targetBudget,
  });

  return {
    total: intelligence.scenarios.expected,
    items: mapBreakdownToItems(intelligence),
    intelligence,
  };
}
