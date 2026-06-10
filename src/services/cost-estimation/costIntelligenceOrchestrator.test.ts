import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import { buildCostIntelligence } from '@/services/cost-estimation/costIntelligenceOrchestrator';
import type { ProjectManifest } from '@/types';

const sampleBom: MaterialListRow[] = [
  { id: 'm1', category: 'structure', item: 'Timber wall framing', quantity: 120, unit: 'lm', sku: 'SKU-TIMBER-FRAMING' },
  { id: 'm2', category: 'structure', item: 'Concrete slab (100mm)', quantity: 85, unit: 'm²', sku: 'SKU-CONCRETE-SLAB-100' },
  { id: 'm3', category: 'openings', item: 'External doors', quantity: 3, unit: 'ea', sku: 'SKU-EXTERNAL-DOOR' },
  { id: 'm4', category: 'openings', item: 'Aluminium windows', quantity: 8, unit: 'ea', sku: 'SKU-ALU-WINDOW' },
  { id: 'm5', category: 'finish', item: 'Internal plasterboard', quantity: 200, unit: 'm²', sku: 'SKU-PLASTERBOARD' },
  { id: 'm6', category: 'roof', item: 'Colorbond roofing', quantity: 95, unit: 'm²', sku: 'SKU-COLORBOND-ROOF' },
  { id: 'm7', category: 'site', item: 'Driveway concrete', quantity: 18, unit: 'm²', sku: 'SKU-DRIVEWAY-CONCRETE' },
];

const manifest: ProjectManifest = {
  name: 'Test Home',
  walls: [],
  openings: [],
  materials: [],
  labels: [],
  dimensions: [],
  gridSize: 20,
};

describe('costIntelligenceOrchestrator', () => {
  it('produces ordered scenario bands and breakdown', () => {
    const report = buildCostIntelligence({
      manifest,
      materialList: sampleBom,
      schedules: { rooms: [{ id: 'r1' } as never], walls: [{ id: 'w1' } as never], windows: [] },
      request: DEFAULT_BUILDING_REQUEST,
      council: { rawText: 'Sydney NSW council', setbacks: { front: 6, side: 1.5, rear: 3 }, maxCoverageRatio: 0.4, specialConditions: [] },
    });

    expect(report.scenarios.bestCase).toBeLessThan(report.scenarios.expected);
    expect(report.scenarios.expected).toBeLessThan(report.scenarios.worstCase);
    expect(report.scenarios.median).toBe(report.scenarios.expected);
    expect(report.scenarios.breakdown).toHaveLength(5);
    expect(report.confidence.score).toBeGreaterThan(0);
    expect(report.risk.level).toBeTruthy();
    expect(report.regionId).toBe('au-nsw-sydney');
  });
});
