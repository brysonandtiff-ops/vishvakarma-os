import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { Point2D } from '@/types';

export type CopilotDocumentKind = 'siteSurvey' | 'boundaryPlan' | 'councilRequirements';

export interface CopilotUploadedDocument {
  id: string;
  kind: CopilotDocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl?: string;
  /** Local session-only data URL for MVP when Firebase is unavailable */
  dataUrl?: string;
}

export interface SiteSurveyExtraction {
  slope: number;
  orientation: string;
  easements: string[];
  surveyNotes: string;
}

export interface BoundaryPlanExtraction {
  boundaryPolygon: Point2D[];
  widthM: number;
  depthM: number;
  areaSqM: number;
}

export interface CopilotIngestionResult {
  siteSurvey?: SiteSurveyExtraction;
  boundary?: BoundaryPlanExtraction;
  council?: CouncilRequirements;
  mergedPrompt?: string;
}

export interface CopilotManifestMetadata {
  sessionId: string;
  designBrief: string;
  council: CouncilRequirements;
  siteSurvey?: SiteSurveyExtraction;
  boundary?: BoundaryPlanExtraction;
  uploadedDocuments: Array<{ id: string; kind: CopilotDocumentKind; fileName: string }>;
  generatedAt: string;
}

export interface CopilotSession {
  id: string;
  designBrief: string;
  documents: CopilotUploadedDocument[];
  ingestion?: CopilotIngestionResult;
  buildingRequest?: BuildingRequest;
  building?: GeneratedBuilding;
  complianceReport?: ComplianceAuditReport;
  stage: PipelineStage | 'review' | 'upload';
  createdAt: string;
  updatedAt: string;
}

export function createCopilotSession(designBrief = ''): CopilotSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    designBrief,
    documents: [],
    stage: 'upload',
    createdAt: now,
    updatedAt: now,
  };
}
