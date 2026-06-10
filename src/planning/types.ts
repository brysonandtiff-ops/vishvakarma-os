import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { Point2D } from '@/types';
import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import type { OptimizationStrategy } from '@/domain/optimization/types';
import type { OrchestratorInput } from '@/services/floorplan-generation/orchestrator';

export type PackingStrategy = 'row' | 'column' | 'clusterPublic' | 'clusterPrivate';

export interface LayoutSolverOptions {
  seed?: number;
  packingStrategy?: PackingStrategy;
  originOffsetX?: number;
  originOffsetY?: number;
  rotationDeg?: 0 | 90;
  attemptBudget?: number;
}

export interface LayoutCandidate {
  id: string;
  strategy?: OptimizationStrategy;
  layoutOptions: LayoutSolverOptions;
  rooms: RoomPlacement[];
  circulation: Point2D[];
  constraints: ConstraintResult;
}

export interface PlanScoreDimensions {
  compliance: number;
  adjacency: number;
  zoningMargin: number;
  programFit: number;
  costEfficiency: number;
  circulation: number;
}

export interface PlanScore {
  candidateId: string;
  total: number;
  dimensions: PlanScoreDimensions;
  disqualifiers: string[];
  highlights: string[];
}

export interface PlanExplanation {
  summary: string;
  winningReasons: string[];
  tradeoffs: string[];
  dimensionComparison?: Record<string, number>;
}

export interface PlanningMetadata {
  candidateCount: number;
  evaluatedCount: number;
  shortlistedCount: number;
  rankedScores: PlanScore[];
  explanation: PlanExplanation;
  selectedCandidateId: string;
  generatedAt: string;
}

export interface PlanningResult {
  selected: GeneratedBuilding;
  shortlist: GeneratedBuilding[];
  candidates: PlanScore[];
  explanation: PlanExplanation;
  planning: PlanningMetadata;
}

export interface PlanningProgress {
  phase: 'generating' | 'scoring' | 'shortlisting' | 'selecting';
  current: number;
  total: number;
  message?: string;
}

export interface PlanningIntelligenceInput extends OrchestratorInput {
  candidateCount?: number;
  shortlistSize?: number;
  fullBuildTopK?: number;
  useWorker?: boolean;
  onPlanningProgress?: (progress: PlanningProgress) => void;
  selectedCandidateId?: string;
}

export const DEFAULT_PLANNING_CONFIG = {
  candidateCount: 100,
  shortlistSize: 3,
  fullBuildTopK: 10,
  mvpCandidateCount: 20,
} as const;
