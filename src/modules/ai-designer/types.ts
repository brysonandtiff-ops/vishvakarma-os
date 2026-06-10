import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';

export interface BuildingDesignerInput {
  prompt: string;
  parcelOverride?: Partial<Parcel>;
  onStage?: (stage: PipelineStage) => void;
}

export interface BuildingDesignerResult {
  building: GeneratedBuilding;
  stage: PipelineStage;
}
