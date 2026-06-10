import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { CopilotDocumentKind } from '@/domain/copilot/copilotSession';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult } from '@/domain/copilot/copilotSession';
import type { PipelineStage, RequestOverride } from '@/services/floorplan-generation/orchestrator';

export interface BuildingDesignerInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  requestOverride?: RequestOverride;
  ingestion?: CopilotIngestionResult;
  sessionId?: string;
  uploadedDocuments?: Array<{ id: string; kind: CopilotDocumentKind; fileName: string }>;
  onStage?: (stage: PipelineStage) => void;
}

export interface BuildingDesignerResult {
  building: GeneratedBuilding;
  stage: PipelineStage;
}
