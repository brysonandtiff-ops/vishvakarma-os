export type MaterialCategory = 'structure' | 'openings' | 'finish' | 'roof' | 'site' | 'mep';
export type TradeCode = 'carpentry' | 'concrete' | 'glazing' | 'roofing' | 'plaster' | 'site';
export type CostUnit = 'ea' | 'm²' | 'lm' | 'm³' | 'kg';
export type SupplierTier = 'budget' | 'standard' | 'premium';
export type QuoteFreshness = 'current' | 'stale';
export type SupplierStrategy = 'best_price' | 'balanced' | 'premium';
export type CostBreakdownCategory = 'materials' | 'labor' | 'openings' | 'site' | 'contingency';
export type CostRiskLevel = 'low' | 'medium' | 'high';
export type CostValueImpactBand = 'cost_foundation' | 'cost_defensible';
export type CostValueImpactLabel = '$5M–15M' | '$10M–25M';

export interface MaterialCatalogEntry {
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: CostUnit;
  baseUnitCost: number;
  laborHoursPerUnit: number;
  tradeCode: TradeCode;
}

export interface LaborRate {
  tradeCode: TradeCode;
  label: string;
  hourlyRate: number;
  productivityFactor: number;
}

export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  sku: string;
  unitCost: number;
  leadTimeDays: number;
  freshness: QuoteFreshness;
  tier: SupplierTier;
}

export interface RegionalCostIndex {
  regionId: string;
  label: string;
  materialMultiplier: number;
  laborMultiplier: number;
  volatility: number;
}

export interface CostBreakdownLine {
  id: string;
  label: string;
  category: CostBreakdownCategory;
  amount: number;
  sharePct: number;
}

export interface CostScenarioBreakdown {
  expected: number;
  bestCase: number;
  worstCase: number;
  median: number;
  breakdown: CostBreakdownLine[];
}

export interface CostConfidenceReport {
  score: number;
  catalogCoverage: number;
  supplierCoverage: number;
  regionalMatch: boolean;
  dataFreshness: number;
  scheduleCompleteness: number;
  summary: string;
}

export interface CostRiskReport {
  level: CostRiskLevel;
  contingencyPct: number;
  drivers: string[];
  varianceBand: number;
}

export interface CostIntelligenceReport {
  scenarios: CostScenarioBreakdown;
  confidence: CostConfidenceReport;
  risk: CostRiskReport;
  regionId: string;
  regionLabel: string;
  supplierStrategy: SupplierStrategy;
  generatedAt: string;
}

export interface CostMoatReport {
  score: number;
  costConfidence: number;
  pricingDefensibility: number;
  valueImpactBand: CostValueImpactBand;
  valueImpactLabel: CostValueImpactLabel;
  summary: string;
}

export interface PricedBomLine {
  rowId: string;
  sku: string | null;
  item: string;
  quantity: number;
  unit: string;
  unitCost: number;
  lineTotal: number;
  supplierId: string | null;
  laborHours: number;
  laborCost: number;
}

export interface LaborBreakdownLine {
  tradeCode: TradeCode;
  label: string;
  hours: number;
  hourlyRate: number;
  amount: number;
}
