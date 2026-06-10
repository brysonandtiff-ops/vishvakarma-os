import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { buildArchitectureMap } from '@/ai/building-designer/generators/architectureMapGenerator';
import { generateFloorPlan } from '@/ai/building-designer/generators/floorplanGenerator';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import { generateSchedules } from '@/ai/building-designer/generators/scheduleGenerator';
import { generateSitePlan } from '@/ai/building-designer/generators/sitePlanGenerator';
import {
  extractRequirements,
  normalizeBuildingRequest,
} from '@/ai/building-designer/generators/requirementsExtractor';
import { buildManifestFromFloorPlan } from '@/ai/building-designer/transformers/manifestTransformer';
import { validateGeneratedBuilding } from '@/ai/building-designer/validators/generatedBuildingValidator';
import { validateBuildingRequest } from '@/ai/building-designer/validators/buildingRequestValidator';
import { analyzeLot } from '@/services/lot-analysis/lotAnalysis';
import { buildCostSummary } from '@/services/cost-estimation/costSummary';

export type PipelineStage =
  | 'extracting'
  | 'constraints'
  | 'layout'
  | 'floorplan'
  | 'schedules'
  | 'complete'
  | 'error';

export interface OrchestratorInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  onStage?: (stage: PipelineStage) => void;
}

export async function runBuildingDesignerPipeline(input: OrchestratorInput): Promise<GeneratedBuilding> {
  input.onStage?.('extracting');
  let request = normalizeBuildingRequest(await extractRequirements(input.prompt, input.parcelOverride));
  request = analyzeLot(request);

  const requestErrors = validateBuildingRequest(request);
  if (requestErrors.length) {
    throw new Error(requestErrors.join('; '));
  }

  input.onStage?.('constraints');
  const constraints = applyConstraints(request);

  input.onStage?.('layout');
  const { rooms, circulation } = solveLayout(constraints);

  input.onStage?.('floorplan');
  const floorPlan = generateFloorPlan(rooms, circulation);
  const sitePlan = generateSitePlan(request, rooms);
  const architectureMap = buildArchitectureMap(constraints.rooms);

  input.onStage?.('schedules');
  const schedules = generateSchedules(floorPlan);
  const manifest = buildManifestFromFloorPlan(floorPlan, request, {
    prompt: input.prompt,
    request,
    sitePlan,
    schedules,
    architectureMap,
    generatedAt: new Date().toISOString(),
  });
  const costSummary = buildCostSummary(manifest);

  const building: GeneratedBuilding = {
    request,
    sitePlan,
    floorPlan,
    schedules,
    architectureMap,
    manifest,
    costSummary,
  };

  const errors = validateGeneratedBuilding(building);
  if (errors.length) {
    throw new Error(errors.join('; '));
  }

  input.onStage?.('complete');
  return building;
}
