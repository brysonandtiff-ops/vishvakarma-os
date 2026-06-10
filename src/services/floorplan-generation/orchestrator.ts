import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult, CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import {
  extractRequirements,
  normalizeBuildingRequest,
} from '@/ai/building-designer/generators/requirementsExtractor';
import { validateBuildingRequest } from '@/ai/building-designer/validators/buildingRequestValidator';
import { analyzeLot } from '@/services/lot-analysis/lotAnalysis';
import { mergeCopilotRequirements } from '@/services/copilot/ingestion/requirementMerger';
import { buildGeneratedBuildingFromLayout } from '@/services/floorplan-generation/buildFromLayout';

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

export async function resolveBuildingRequest(
  input: OrchestratorInput,
): Promise<{ request: BuildingRequest; council?: CouncilRequirements }> {
  if (input.ingestion) {
    const merged = await mergeCopilotRequirements(input.prompt, input.ingestion);
    return {
      request: analyzeLot(normalizeBuildingRequest(merged.request)),
      council: merged.council,
    };
  }

  return {
    request: analyzeLot(
      normalizeBuildingRequest(await extractRequirements(input.prompt, input.parcelOverride)),
    ),
  };
}

export async function runBuildingDesignerPipeline(input: OrchestratorInput): Promise<GeneratedBuilding> {
  if (input.ingestion) {
    input.onStage?.('ingesting');
  } else {
    input.onStage?.('extracting');
  }

  const { request, council } = await resolveBuildingRequest(input);

  const requestErrors = validateBuildingRequest(request);
  if (requestErrors.length) {
    throw new Error(requestErrors.join('; '));
  }

  input.onStage?.('constraints');
  const constraints = applyConstraints(request);

  input.onStage?.('layout');
  const { rooms, circulation } = solveLayout(constraints);

  input.onStage?.('floorplan');
  const building = buildGeneratedBuildingFromLayout({
    request,
    constraints,
    rooms,
    circulation,
    prompt: input.prompt,
    council,
    sessionId: input.sessionId,
    uploadedDocuments: input.uploadedDocuments,
    ingestion: input.ingestion
      ? { siteSurvey: input.ingestion.siteSurvey, boundary: input.ingestion.boundary }
      : undefined,
  });

  input.onStage?.('concept');
  input.onStage?.('schedules');
  input.onStage?.('compliance');
  input.onStage?.('complete');
  return building;
}
