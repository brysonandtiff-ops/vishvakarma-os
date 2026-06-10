import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { BuildingSchedules } from '@/domain/buildings/generatedBuilding';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type {
  CostBreakdownCategory,
  CostBreakdownLine,
  CostIntelligenceReport,
  CostScenarioBreakdown,
} from '@/domain/cost/types';
import { analyzeCostRisk } from '@/services/cost-estimation/costRiskAnalyzer';
import { scoreCostConfidence } from '@/services/cost-estimation/costConfidenceScorer';
import { computeLaborCost } from '@/services/cost-estimation/laborCostEngine';
import { resolveRegion } from '@/services/cost-estimation/regionalCostIndex';
import { priceBomLines } from '@/services/cost-estimation/supplierPricingEngine';
import type { ProjectManifest } from '@/types';
import { assertAllowedFlow } from '@/core-contract/systemFlow';

export interface CostIntelligenceInput {
  manifest: ProjectManifest;
  materialList: MaterialListRow[];
  schedules: BuildingSchedules;
  request: BuildingRequest;
  council?: CouncilRequirements;
  targetBudget?: number;
}

const OPENING_SKUS = ['SKU-EXTERNAL-DOOR', 'SKU-ALU-WINDOW'];
const SITE_SKUS = ['SKU-DRIVEWAY-CONCRETE'];

function sumLines(lines: ReturnType<typeof priceBomLines>): number {
  return lines.reduce((s, l) => s + l.lineTotal, 0);
}

function sumSkus(lines: ReturnType<typeof priceBomLines>, skus: string[]): number {
  return lines
    .filter((l) => l.sku && skus.includes(l.sku))
    .reduce((s, l) => s + l.lineTotal, 0);
}

function buildBreakdown(
  materials: number,
  labor: number,
  openings: number,
  site: number,
  contingency: number,
  total: number,
): CostBreakdownLine[] {
  const rows: Array<{ id: string; label: string; category: CostBreakdownCategory; amount: number }> = [
    { id: 'materials', label: 'Materials', category: 'materials', amount: materials },
    { id: 'labor', label: 'Labor', category: 'labor', amount: labor },
    { id: 'openings', label: 'Openings', category: 'openings', amount: openings },
    { id: 'site', label: 'Site works', category: 'site', amount: site },
    { id: 'contingency', label: 'Contingency', category: 'contingency', amount: contingency },
  ];
  return rows.map((row) => ({
    ...row,
    sharePct: total > 0 ? Math.round((row.amount / total) * 100) : 0,
  }));
}

function buildScenarioTotal(
  pricedLines: ReturnType<typeof priceBomLines>,
  laborTotal: number,
  contingencyPct: number,
): { total: number; breakdown: CostBreakdownLine[] } {
  const allMaterial = sumLines(pricedLines);
  const openings = sumSkus(pricedLines, OPENING_SKUS);
  const site = sumSkus(pricedLines, SITE_SKUS);
  const materials = allMaterial - openings - site;
  const subtotal = materials + laborTotal + openings + site;
  const contingency = Math.round(subtotal * (contingencyPct / 100));
  const total = subtotal + contingency;
  return {
    total,
    breakdown: buildBreakdown(materials, laborTotal, openings, site, contingency, total),
  };
}

export function buildCostIntelligence(input: CostIntelligenceInput): CostIntelligenceReport {
  assertAllowedFlow('GENERATED_BUILDING', 'COST_INTELLIGENCE');
  const region = resolveRegion(input.request, input.council);

  const pricedBest = priceBomLines(input.materialList, region, 'best_price');
  const pricedBalanced = priceBomLines(input.materialList, region, 'balanced');
  const pricedPremium = priceBomLines(input.materialList, region, 'premium');

  const laborBest = computeLaborCost(pricedBest, region, 0.9).total;
  const laborExpected = computeLaborCost(pricedBalanced, region, 1).total;
  const laborWorst = computeLaborCost(pricedPremium, region, 1.15).total;

  const bestScenario = buildScenarioTotal(pricedBest, laborBest, 5);
  const expectedScenario = buildScenarioTotal(pricedBalanced, laborExpected, 10);
  const worstContingency = 10 + Math.round(region.volatility * 100);
  const worstScenario = buildScenarioTotal(pricedPremium, laborWorst, worstContingency);

  const scenarios: CostScenarioBreakdown = {
    expected: expectedScenario.total,
    bestCase: bestScenario.total,
    worstCase: worstScenario.total,
    median: expectedScenario.total,
    breakdown: expectedScenario.breakdown,
  };

  const confidence = scoreCostConfidence({
    materialList: input.materialList,
    pricedLines: pricedBalanced,
    region,
    schedules: input.schedules,
  });

  const risk = analyzeCostRisk({
    scenarios,
    confidence,
    region,
    request: input.request,
    targetBudget: input.targetBudget,
  });

  return {
    scenarios,
    confidence,
    risk,
    regionId: region.regionId,
    regionLabel: region.label,
    supplierStrategy: 'balanced',
    generatedAt: new Date().toISOString(),
  };
}
