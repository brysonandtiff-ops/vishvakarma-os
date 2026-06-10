import { describe, expect, it } from 'vitest';
import { scoreAdjacency } from '@/ai/building-designer/generators/adjacencySolver';
import { parseRequirementsFallback } from '@/ai/building-designer/generators/requirementsExtractor';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import { generateFloorPlan } from '@/ai/building-designer/generators/floorplanGenerator';
import { buildManifestFromFloorPlan } from '@/ai/building-designer/transformers/manifestTransformer';
import { generateSchedules } from '@/ai/building-designer/generators/scheduleGenerator';
import { generateSitePlan } from '@/ai/building-designer/generators/sitePlanGenerator';
import { buildArchitectureMap } from '@/ai/building-designer/generators/architectureMapGenerator';
import { validateManifest } from '@/core/manifestSchema';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';

const GOLDEN_PROMPT = '4-bedroom modern home on 600m² corner block with double garage';

describe('AI Building Designer', () => {
  it('parses golden prompt requirements via fallback', () => {
    const request = parseRequirementsFallback(GOLDEN_PROMPT);
    expect(request.bedrooms).toBe(4);
    expect(request.garageSpaces).toBe(2);
    expect(request.parcel.area).toBe(600);
    expect(request.parcel.cornerLot).toBe(true);
    expect(request.style).toBe('modern');
  });

  it('scores kitchen-dining adjacency higher than master-living avoidance', () => {
    expect(scoreAdjacency('Kitchen', 'Dining')).toBeGreaterThan(0);
    expect(scoreAdjacency('MasterBedroom', 'Living')).toBeLessThan(0);
  });

  it('builds 4BR layout with garage and valid manifest', async () => {
    const building = await runBuildingDesignerPipeline({ prompt: GOLDEN_PROMPT });
    expect(building.floorPlan.rooms.filter((r) => r.type === 'Bedroom' || r.type === 'MasterBedroom').length).toBeGreaterThanOrEqual(4);
    expect(building.floorPlan.rooms.some((r) => r.type === 'Garage')).toBe(true);
    expect(building.floorPlan.walls.length).toBeGreaterThan(8);
    expect(validateManifest(building.manifest).valid).toBe(true);
    expect(building.costSummary.total).toBeGreaterThan(0);
    expect(building.schedules.rooms.length).toBeGreaterThan(5);
  });

  it('generates deterministic floor plan components', () => {
    const request = parseRequirementsFallback('3-bedroom home with single garage');
    const constraints = applyConstraints(request);
    const { rooms, circulation } = solveLayout(constraints);
    const floorPlan = generateFloorPlan(rooms, circulation);
    const sitePlan = generateSitePlan(request, rooms);
    const schedules = generateSchedules(floorPlan);
    const architectureMap = buildArchitectureMap(constraints.rooms);
    const manifest = buildManifestFromFloorPlan(floorPlan, request, {
      prompt: '3-bedroom home',
      request,
      sitePlan,
      schedules,
      architectureMap,
      generatedAt: new Date().toISOString(),
    });

    expect(floorPlan.openings.some((o) => o.type === 'door')).toBe(true);
    expect(sitePlan.parcelBoundary.length).toBeGreaterThan(3);
    expect(validateManifest(manifest).valid).toBe(true);
  });
});
