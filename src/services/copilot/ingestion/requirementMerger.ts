import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { createParcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult } from '@/domain/copilot/copilotSession';
import { createCouncilRequirements } from '@/domain/copilot/councilRequirements';
import { extractRequirements } from '@/ai/building-designer/generators/requirementsExtractor';

export async function mergeCopilotRequirements(
  designBrief: string,
  ingestion: CopilotIngestionResult,
): Promise<{ request: BuildingRequest; council: ReturnType<typeof createCouncilRequirements> }> {
  const promptParts = [designBrief];
  if (ingestion.siteSurvey?.surveyNotes) {
    promptParts.push(`Site survey: ${ingestion.siteSurvey.surveyNotes.slice(0, 300)}`);
  }
  if (ingestion.council?.rawText) {
    promptParts.push(`Council: ${ingestion.council.rawText.slice(0, 300)}`);
  }

  const mergedPrompt = promptParts.filter(Boolean).join('\n');
  const parcelOverride: Partial<BuildingRequest['parcel']> = {};

  if (ingestion.boundary) {
    parcelOverride.boundaryPolygon = ingestion.boundary.boundaryPolygon;
    parcelOverride.width = ingestion.boundary.widthM;
    parcelOverride.depth = ingestion.boundary.depthM;
    parcelOverride.area = ingestion.boundary.areaSqM;
  }

  if (ingestion.siteSurvey) {
    parcelOverride.slope = ingestion.siteSurvey.slope;
    parcelOverride.orientation = ingestion.siteSurvey.orientation;
    parcelOverride.surveyNotes = ingestion.siteSurvey.surveyNotes;
  }

  const request = await extractRequirements(mergedPrompt || designBrief, parcelOverride);
  const parcel = createParcel({
    ...request.parcel,
    ...parcelOverride,
  });

  const council = createCouncilRequirements(ingestion.council ?? {});

  return {
    request: { ...request, parcel },
    council,
  };
}
