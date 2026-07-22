import { describe, expect, it } from 'vitest';
import { calculateProjectCostItems, sumCostItems } from '@/utils/costEstimate';
import type { ProjectManifest } from '@/types';

describe('costEstimate', () => {
  it('calculates wall and opening costs', () => {
    const manifest: ProjectManifest = {
      version: '1.0.0',
      name: 'Test',
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 200, y: 0 },
          thickness: 10,
          height: 240,
          material: 'material-paint',
        },
      ],
      openings: [
        {
          id: 'o1',
          type: 'door',
          wallId: 'w1',
          position: 0.5,
          width: 90,
          height: 210,
        },
      ],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
      gridSize: 20,
      snapToGrid: true,
      metadata: { created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z' },
    };

    const items = calculateProjectCostItems(manifest);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(sumCostItems(items)).toBeGreaterThan(0);
  });
});
