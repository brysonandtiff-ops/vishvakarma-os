import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { CostMoatReport } from '@/domain/cost/types';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { Parcel } from '@/domain/parcels/parcel';
import type { CopilotIngestionResult } from '@/domain/copilot/copilotSession';
import type { RoomType } from '@/domain/rooms/roomType';

export type OptimizationObjective =
  | 'family_focused'
  | 'budget_optimized'
  | 'energy_optimized'
  | 'premium_lifestyle'
  | 'resale_value'
  | 'vastu_harmonized';

export type OptimizationScoreCategory =
  | 'compliance'
  | 'construction_cost'
  | 'natural_light'
  | 'energy'
  | 'circulation'
  | 'privacy'
  | 'resale'
  | 'buildability'
  | 'overall';

export interface OptimizationExplanation {
  summary: string;
  metrics: Record<string, number>;
  deltas?: Record<string, number>;
}

export interface OptimizationScore {
  category: OptimizationScoreCategory;
  score: number;
  weight: number;
  explanation: OptimizationExplanation;
}

export interface OptimizationStrategy {
  id: string;
  objective: OptimizationObjective;
  label: string;
  layoutSeed: number;
  roomSizeBias: Partial<Record<RoomType, number>>;
  roomPriority: Partial<Record<RoomType, number>>;
  adjacencyMultipliers: Array<{ roomA: RoomType; roomB: RoomType; multiplier: number }>;
  injectExtras?: string[];
  dropOptionalExtras?: boolean;
  compactFootprint?: boolean;
  northernLivingBias?: boolean;
  wetAreaStacking?: boolean;
}

export interface OptimizationCandidate {
  id: string;
  label: string;
  objective: OptimizationObjective;
  building: GeneratedBuilding;
  scores: OptimizationScore[];
  overallScore: number;
  rank: number;
}

export interface SiteFitnessSubScore {
  key: string;
  label: string;
  score: number;
  explanation: OptimizationExplanation;
}

export interface SiteFitnessScore {
  overall: number;
  solarOrientation: number;
  slopeSuitability: number;
  accessEfficiency: number;
  setbackUtilization: number;
  openSpaceQuality: number;
  explanations: SiteFitnessSubScore[];
}

export type OptimizationRequestOverride = Partial<
  Pick<BuildingRequest, 'bedrooms' | 'bathrooms' | 'garageSpaces' | 'levels' | 'style' | 'extras'>
>;

export interface OptimizationBatchInput {
  prompt: string;
  targetBudget?: number;
  lifestyleGoals?: string[];
  parcelOverride?: Partial<Parcel>;
  requestOverride?: OptimizationRequestOverride;
  ingestion?: CopilotIngestionResult;
  sessionId?: string;
  uploadedDocuments?: Array<{ id: string; kind: string; fileName: string }>;
}

export type TradeoffDirection = 'improves' | 'worsens' | 'unchanged';

export interface TradeoffItem {
  dimension: string;
  direction: TradeoffDirection;
  detail: string;
}

export type ValueImpactBand = 'foundation' | 'defensible';
export type ValueImpactLabel = '$1M–3M' | '$3M–8M';

export interface MoatGainReport {
  score: number;
  compositeScore: number;
  decisionLift: number;
  winnerMargin: number;
  strategyDiversity: number;
  permitConfidence: number;
  explainabilityIndex: number;
  valueImpactBand: ValueImpactBand;
  valueImpactLabel: ValueImpactLabel;
  costMoat?: CostMoatReport;
  summary: string;
}

export interface OptimizationReport {
  winnerId: string;
  runnerUpId: string;
  winnerLabel: string;
  runnerUpLabel: string;
  tradeoffs: TradeoffItem[];
  riskAreas: string[];
  estimatedCost: number;
  complianceConfidence: number;
  approvalConfidence: number;
  permitReady: boolean;
  moatGain: MoatGainReport;
  generatedAt: string;
}

export interface OptimizationBatch {
  id: string;
  input: OptimizationBatchInput;
  resolvedRequest: BuildingRequest;
  siteFitness: SiteFitnessScore;
  candidates: OptimizationCandidate[];
  winnerId: string;
  runnerUpId: string;
  report: OptimizationReport;
  createdAt: string;
}

export interface OptimizationManifestMetadata {
  batchId: string;
  candidateId: string;
  objective: OptimizationObjective;
  overallScore: number;
  rank: number;
  generatedAt: string;
  promotedAt?: string;
}

export interface OptimizationCandidateSummary {
  id: string;
  label: string;
  overallScore: number;
  rank: number;
  estimatedCost: number;
  costBestCase?: number;
  costWorstCase?: number;
  costMedian?: number;
  costConfidence?: number;
  costRiskLevel?: 'low' | 'medium' | 'high';
  permitReady: boolean;
}

export interface OptimizationBatchRecord {
  id: string;
  userId: string;
  input: OptimizationBatchInput;
  winnerId: string;
  moatGain: MoatGainReport;
  candidateSummaries: OptimizationCandidateSummary[];
  promotedProjectId?: string;
  createdAt: string;
}
