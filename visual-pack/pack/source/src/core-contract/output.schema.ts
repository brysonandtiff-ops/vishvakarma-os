/**
 * Deliverable output contract — unified generation bundle shape.
 */

import type { ConceptDesign } from '@/domain/copilot/conceptDesign';
import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type {
  ArchitectureMapGraph,
  BuildingSchedules,
  CostSummary,
  GeneratedFloorPlan,
  SitePlan,
} from '@/domain/buildings/generatedBuilding';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { ProjectManifest } from '@/types';

export interface GeneratedBuildingOutput {
  request: BuildingRequest;
  sitePlan: SitePlan;
  floorPlan: GeneratedFloorPlan;
  schedules: BuildingSchedules;
  architectureMap: ArchitectureMapGraph;
  manifest: ProjectManifest;
  costSummary: CostSummary;
  conceptDesign: ConceptDesign;
  materialList: MaterialListRow[];
  complianceReport: ComplianceAuditReport;
  copilot?: CopilotManifestMetadata;
}

export interface PermitPackageOutput {
  zipBlob: Blob;
  documentCount: number;
  complianceGated: true;
}

export interface OptimizationBatchOutput {
  candidateCount: 6;
  winnerId: string;
  runnerUpId: string;
  reportIncludesMoatGain: boolean;
}

export type SystemDeliverable =
  | { kind: 'generated_building'; data: GeneratedBuildingOutput }
  | { kind: 'permit_package'; data: PermitPackageOutput }
  | { kind: 'optimization_batch'; data: OptimizationBatchOutput };
