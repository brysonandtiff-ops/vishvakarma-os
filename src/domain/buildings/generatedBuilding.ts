import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { RoomType } from '@/domain/rooms/roomType';
import type { RoomScheduleRow, WallScheduleRow, WindowScheduleRow } from '@/domain/schedules/scheduleTypes';
import type { ConceptDesign } from '@/domain/copilot/conceptDesign';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { CostIntelligenceReport } from '@/domain/cost/types';
import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilAssessment } from '@/domain/council-intelligence/types';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { PlanningMetadata } from '@/planning/types';
import type { Opening, Point2D, ProjectManifest, Wall } from '@/types';

export interface RoomPlacement {
  id: string;
  type: RoomType;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  floor: number;
}

export interface SitePlan {
  parcelBoundary: Point2D[];
  buildingFootprint: Point2D[];
  setbacks: { front: number; side: number; rear: number };
  orientation: string;
}

export interface ArchitectureMapNode {
  id: string;
  label: string;
  type: RoomType;
}

export interface ArchitectureMapEdge {
  from: string;
  to: string;
  weight: number;
}

export interface ArchitectureMapGraph {
  nodes: ArchitectureMapNode[];
  edges: ArchitectureMapEdge[];
}

export interface GeneratedFloorPlan {
  rooms: RoomPlacement[];
  walls: Wall[];
  openings: Opening[];
  circulation: Point2D[];
}

export interface BuildingSchedules {
  rooms: RoomScheduleRow[];
  walls: WallScheduleRow[];
  windows: WindowScheduleRow[];
}

export interface CostSummary {
  total: number;
  items: { id: string; label: string; amount: number }[];
  intelligence?: CostIntelligenceReport;
}

export interface GeneratedBuilding {
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
  councilAssessment?: CouncilAssessment;
  planning?: PlanningMetadata;
  shortlistBuildings?: GeneratedBuilding[];
}
