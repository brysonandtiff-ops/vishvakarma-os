/**
 * Cost intelligence contract — read-only economic reasoning layer.
 * Must not import layout/constraint solvers (enforced by forbidden-edge checks).
 */

import type {
  CostBreakdownCategory,
  CostBreakdownLine,
  CostConfidenceReport,
  CostIntelligenceReport,
  CostMoatReport,
  CostRiskReport,
  CostScenarioBreakdown,
  CostValueImpactBand,
  CostValueImpactLabel,
  LaborBreakdownLine,
  MaterialCatalogEntry,
  PricedBomLine,
  RegionalCostIndex,
  SupplierQuote,
  SupplierStrategy,
} from '@/domain/cost/types';

export type {
  CostBreakdownCategory,
  CostBreakdownLine,
  CostConfidenceReport,
  CostIntelligenceReport,
  CostMoatReport,
  CostRiskReport,
  CostScenarioBreakdown,
  CostValueImpactBand,
  CostValueImpactLabel,
  LaborBreakdownLine,
  MaterialCatalogEntry,
  PricedBomLine,
  RegionalCostIndex,
  SupplierQuote,
  SupplierStrategy,
};

export const COST_INTELLIGENCE_VERSION = '0.9.0';

export interface CostIntelligenceInput {
  manifest: import('@/types').ProjectManifest;
  materialList: import('@/domain/copilot/materialList').MaterialListRow[];
  schedules: import('@/domain/buildings/generatedBuilding').BuildingSchedules;
  request: import('@/domain/buildings/buildingRequest').BuildingRequest;
  council?: import('@/domain/copilot/councilRequirements').CouncilRequirements;
  targetBudget?: number;
  regionId?: string;
  supplierStrategy?: SupplierStrategy;
}

export interface CostIntelligenceOutput {
  report: CostIntelligenceReport;
  /** Cost layer is evaluation-only — never returns layout mutations. */
  readonly influencesGeneration: false;
}
