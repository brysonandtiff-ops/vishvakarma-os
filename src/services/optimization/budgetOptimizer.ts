/**
 * EXPLICIT_ROUTE: BUDGET_OPTIMIZATION (experimental)
 * Cost signals reshape layout only when targetBudget is set — not default pipeline.
 * See system-map.json explicit_routes.BUDGET_OPTIMIZATION.
 */
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { OptimizationManifestMetadata, OptimizationStrategy } from '@/domain/optimization/types';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { buildGeneratedBuildingFromLayout } from '@/services/floorplan-generation/buildFromLayout';

export interface BudgetOptimizeInput {
  request: BuildingRequest;
  strategy: OptimizationStrategy;
  targetBudget: number;
  prompt: string;
  council?: CouncilRequirements;
  sessionId?: string;
  optimization?: OptimizationManifestMetadata;
  initialBuilding: GeneratedBuilding;
}

export interface BudgetOptimizeResult {
  building: GeneratedBuilding;
  metBudget: boolean;
  adjustments: string[];
}

const OPTIONAL_ROOM_TYPES = new Set(['Study', 'Mudroom']);

function generateCandidate(
  request: BuildingRequest,
  strategy: OptimizationStrategy,
  input: Omit<BudgetOptimizeInput, 'initialBuilding'>,
) {
  const constraints = applyConstraints(request, strategy);
  const { rooms, circulation } = solveLayout(constraints, strategy);
  return buildGeneratedBuildingFromLayout({
    request,
    constraints,
    rooms,
    circulation,
    prompt: input.prompt,
    council: input.council,
    sessionId: input.sessionId,
    optimization: input.optimization,
    targetBudget: input.targetBudget,
  });
}

export function optimizeForBudget(input: BudgetOptimizeInput): BudgetOptimizeResult {
  const adjustments: string[] = [];
  let request = { ...input.request, extras: [...(input.request.extras ?? [])] };
  let strategy = { ...input.strategy };

  if (input.initialBuilding.costSummary.total <= input.targetBudget) {
    return { building: input.initialBuilding, metBudget: true, adjustments: [] };
  }

  if (request.extras?.length) {
    request = {
      ...request,
      extras: request.extras.filter((e) => !/study|office|mudroom|alfresco/i.test(e)),
    };
    adjustments.push('Removed optional extras (study, mudroom, alfresco) to reduce cost.');
  }

  let building = generateCandidate(request, strategy, input);
  if (building.costSummary.total <= input.targetBudget) {
    return { building, metBudget: true, adjustments };
  }

  strategy = { ...strategy, compactFootprint: true, dropOptionalExtras: true };
  let constraints = applyConstraints(request, strategy);
  for (const room of constraints.rooms) {
    if (!OPTIONAL_ROOM_TYPES.has(room.type)) {
      room.widthM = Math.max(2, room.widthM * 0.92);
      room.depthM = Math.max(2, room.depthM * 0.92);
    }
  }
  adjustments.push('Reduced room sizes by 8% and compacted footprint.');

  const layout = solveLayout(constraints, strategy);
  building = buildGeneratedBuildingFromLayout({
    request,
    constraints,
    rooms: layout.rooms,
    circulation: layout.circulation,
    prompt: input.prompt,
    council: input.council,
    sessionId: input.sessionId,
    optimization: input.optimization,
  });

  if (building.costSummary.total <= input.targetBudget) {
    return { building, metBudget: true, adjustments };
  }

  constraints = applyConstraints(
    { ...request, garageSpaces: Math.max(1, request.garageSpaces) },
    strategy,
  );
  const garage = constraints.rooms.find((r) => r.type === 'Garage');
  if (garage) {
    garage.widthM = Math.max(3, garage.widthM * 0.85);
    adjustments.push('Reduced garage width by 15%.');
  }

  const layout2 = solveLayout(constraints, strategy);
  building = buildGeneratedBuildingFromLayout({
    request,
    constraints,
    rooms: layout2.rooms,
    circulation: layout2.circulation,
    prompt: input.prompt,
    council: input.council,
    sessionId: input.sessionId,
    optimization: input.optimization,
  });

  const metBudget = building.costSummary.total <= input.targetBudget;
  if (!metBudget) {
    adjustments.push(
      `Best-effort cost $${building.costSummary.total.toLocaleString()} still exceeds $${input.targetBudget.toLocaleString()} target.`,
    );
  }

  return { building, metBudget, adjustments };
}
