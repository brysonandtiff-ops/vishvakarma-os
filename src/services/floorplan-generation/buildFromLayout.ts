import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding, RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { OptimizationManifestMetadata } from '@/domain/optimization/types';
import { buildArchitectureMap } from '@/ai/building-designer/generators/architectureMapGenerator';
import { generateConceptDesign } from '@/ai/building-designer/generators/conceptDesignGenerator';
import { generateFloorPlan } from '@/ai/building-designer/generators/floorplanGenerator';
import { generateMaterialList } from '@/ai/building-designer/generators/materialListGenerator';
import { generateSchedules } from '@/ai/building-designer/generators/scheduleGenerator';
import { generateSitePlan } from '@/ai/building-designer/generators/sitePlanGenerator';
import { buildManifestFromFloorPlan } from '@/ai/building-designer/transformers/manifestTransformer';
import { validateGeneratedBuilding } from '@/ai/building-designer/validators/generatedBuildingValidator';
import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import { buildCostSummary } from '@/services/cost-estimation/costSummary';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import type { Point2D } from '@/types';

export interface BuildFromLayoutInput {
  request: BuildingRequest;
  constraints: ConstraintResult;
  rooms: RoomPlacement[];
  circulation: Point2D[];
  prompt: string;
  council?: CouncilRequirements;
  sessionId?: string;
  uploadedDocuments?: CopilotManifestMetadata['uploadedDocuments'];
  ingestion?: { siteSurvey?: CopilotManifestMetadata['siteSurvey']; boundary?: CopilotManifestMetadata['boundary'] };
  optimization?: OptimizationManifestMetadata;
}

export function buildGeneratedBuildingFromLayout(input: BuildFromLayoutInput): GeneratedBuilding {
  const floorPlan = generateFloorPlan(input.rooms, input.circulation);
  const sitePlan = generateSitePlan(input.request, input.rooms, input.council);
  const architectureMap = buildArchitectureMap(input.constraints.rooms);
  const conceptDesign = generateConceptDesign(input.request, floorPlan, architectureMap);
  const schedules = generateSchedules(floorPlan);
  const materialList = generateMaterialList(floorPlan, schedules);

  const copilotMeta: CopilotManifestMetadata | undefined = input.council
    ? {
        sessionId: input.sessionId ?? crypto.randomUUID(),
        designBrief: input.prompt,
        council: input.council,
        siteSurvey: input.ingestion?.siteSurvey,
        boundary: input.ingestion?.boundary,
        uploadedDocuments: input.uploadedDocuments ?? [],
        generatedAt: new Date().toISOString(),
      }
    : undefined;

  const manifest = buildManifestFromFloorPlan(floorPlan, input.request, {
    prompt: input.prompt,
    request: input.request,
    sitePlan,
    schedules,
    architectureMap,
    generatedAt: new Date().toISOString(),
    copilot: copilotMeta,
    optimization: input.optimization,
  });

  const costSummary = buildCostSummary(manifest);
  const complianceReport = runComplianceAuditFromManifest(manifest, {
    id: input.sessionId,
    name: manifest.name,
  });

  const building: GeneratedBuilding = {
    request: input.request,
    sitePlan,
    floorPlan,
    schedules,
    architectureMap,
    manifest,
    costSummary,
    conceptDesign,
    materialList,
    complianceReport,
    copilot: copilotMeta,
  };

  const errors = validateGeneratedBuilding(building);
  if (errors.length) {
    throw new Error(errors.join('; '));
  }

  return building;
}
