import { describe, expect, it } from 'vitest';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import { buildGeneratedBuildingFromLayout } from '@/services/floorplan-generation/buildFromLayout';
import { optimizeForBudget } from '@/services/optimization/budgetOptimizer';
import { STRATEGY_PROFILES } from '@/services/optimization/strategyProfiles';

describe('budgetOptimizer', () => {
  it('returns building within or closest to target budget', () => {
    const strategy = STRATEGY_PROFILES[1];
    const constraints = applyConstraints(DEFAULT_BUILDING_REQUEST, strategy);
    const { rooms, circulation } = solveLayout(constraints, strategy);
    const initial = buildGeneratedBuildingFromLayout({
      request: DEFAULT_BUILDING_REQUEST,
      constraints,
      rooms,
      circulation,
      prompt: 'budget test',
    });

    const result = optimizeForBudget({
      request: DEFAULT_BUILDING_REQUEST,
      strategy,
      targetBudget: 1,
      prompt: 'budget test',
      initialBuilding: initial,
    });

    expect(result.building.costSummary.total).toBeGreaterThan(0);
    expect(result.adjustments.length).toBeGreaterThan(0);
    expect(result.building.complianceReport.results.length).toBe(15);
  });
});
