import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult, CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { buildArchitectureMap } from '@/ai/building-designer/generators/architectureMapGenerator';
import { generateConceptDesign } from '@/ai/building-designer/generators/conceptDesignGenerator';
import { generateFloorPlan } from '@/ai/building-designer/generators/floorplanGenerator';
import { generateMaterialList } from '@/ai/building-designer/generators/materialListGenerator';
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
import { mergeCopilotRequirements } from '@/services/copilot/ingestion/requirementMerger';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';

export type PipelineStage =
  | 'ingesting'
  | 'extracting'
  | 'constraints'
  | 'concept'
  | 'layout'
  | 'floorplan'
  | 'schedules'
  | 'compliance'
  | 'complete'
  | 'error';

export interface OrchestratorInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  ingestion?: CopilotIngestionResult;
  sessionId?: string;
  uploadedDocuments?: CopilotManifestMetadata['uploadedDocuments'];
  onStage?: (stage: PipelineStage) => void;
}

export async function runBuildingDesignerPipeline(input: OrchestratorInput): Promise<GeneratedBuilding> {
  let request: BuildingRequest;
  let council: CouncilRequirements | undefined;

  if (input.ingestion) {
    input.onStage?.('ingesting');
    const merged = await mergeCopilotRequirements(input.prompt, input.ingestion);
    request = analyzeLot(normalizeBuildingRequest(merged.request));
    council = merged.council;
  } else {
    input.onStage?.('extracting');
    request = analyzeLot(
      normalizeBuildingRequest(await extractRequirements(input.prompt, input.parcelOverride)),
    );
  }

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
  const sitePlan = generateSitePlan(request, rooms, council);
  const architectureMap = buildArchitectureMap(constraints.rooms);

  input.onStage?.('concept');
  const conceptDesign = generateConceptDesign(request, floorPlan, architectureMap);

  input.onStage?.('schedules');
  const schedules = generateSchedules(floorPlan);
  const materialList = generateMaterialList(floorPlan, schedules);

  const copilotMeta: CopilotManifestMetadata | undefined = council
    ? {
        sessionId: input.sessionId ?? crypto.randomUUID(),
        designBrief: input.prompt,
        council,
        siteSurvey: input.ingestion?.siteSurvey,
        boundary: input.ingestion?.boundary,
        uploadedDocuments: input.uploadedDocuments ?? [],
        generatedAt: new Date().toISOString(),
      }
    : undefined;

  const manifest = buildManifestFromFloorPlan(floorPlan, request, {
    prompt: input.prompt,
    request,
    sitePlan,
    schedules,
    architectureMap,
    generatedAt: new Date().toISOString(),
    copilot: copilotMeta,
  });
  const costSummary = buildCostSummary(manifest);

  input.onStage?.('compliance');
  const complianceReport = runComplianceAuditFromManifest(manifest, {
    id: input.sessionId,
    name: manifest.name,
  });

  const building: GeneratedBuilding = {
    request,
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

  input.onStage?.('complete');
  return building;
}
