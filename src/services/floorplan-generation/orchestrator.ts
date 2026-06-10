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
import type { PipelineStage } from '@/core-contract/pipeline.schema';

export type { PipelineStage };

export type RequestOverride = Partial<
  Pick<BuildingRequest, 'bedrooms' | 'bathrooms' | 'garageSpaces' | 'levels' | 'style' | 'extras'>
>;

export interface OrchestratorInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  requestOverride?: RequestOverride;
  ingestion?: CopilotIngestionResult;
  sessionId?: string;
  uploadedDocuments?: CopilotManifestMetadata['uploadedDocuments'];
  onStage?: (stage: PipelineStage) => void;
}

export function mergeResolvedRequest(
  base: BuildingRequest,
  input: Pick<OrchestratorInput, 'requestOverride' | 'parcelOverride'>,
): BuildingRequest {
  let request = normalizeBuildingRequest({
    ...base,
    ...(input.requestOverride ?? {}),
  });
  if (input.parcelOverride) {
    request = {
      ...request,
      parcel: { ...request.parcel, ...input.parcelOverride },
    };
  }
  return analyzeLot(request);
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

  const { request: resolved, council } = await resolveBuildingRequest(input);
  const request = mergeResolvedRequest(resolved, input);

  const requestErrors = validateBuildingRequest(request);
  if (requestErrors.length) {
    throw new Error(requestErrors.join('; '));
  }

  input.onStage?.('constraints');
  const constraints = applyConstraints(request);

  input.onStage?.('layout');
  const { rooms, circulation } = solveLayout(constraints);

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
    onStage: input.onStage,
  });

  input.onStage?.('complete');
  return building;
}
