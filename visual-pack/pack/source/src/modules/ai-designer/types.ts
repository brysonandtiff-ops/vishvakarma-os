import type { CopilotDocumentKind } from '@/domain/copilot/copilotSession';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult } from '@/domain/copilot/copilotSession';
import type { PlanExplanation, PlanningProgress, PlanScore } from '@/planning/types';
import type { PipelineStage, RequestOverride } from '@/services/floorplan-generation/orchestrator';

export interface BuildingDesignerInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  requestOverride?: RequestOverride;
  ingestion?: CopilotIngestionResult;
  sessionId?: string;
  uploadedDocuments?: Array<{ id: string; kind: CopilotDocumentKind; fileName: string }>;
  onStage?: (stage: PipelineStage) => void;
  candidateCount?: number;
  fullBuildTopK?: number;
  useWorker?: boolean;
  selectedCandidateId?: string;
  onPlanningProgress?: (progress: PlanningProgress) => void;
}

export interface BuildingDesignerResult {
  building: GeneratedBuilding;
  stage: PipelineStage;
  planning?: GeneratedBuilding['planning'];
  shortlist?: GeneratedBuilding[];
  rankedScores?: PlanScore[];
  explanation?: PlanExplanation;
}
