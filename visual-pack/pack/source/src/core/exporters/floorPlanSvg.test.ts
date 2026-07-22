import { describe, expect, it } from 'vitest';
import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import type { ProjectManifest } from '@/types';

const baseManifest: ProjectManifest = {
  name: 'Test',
  walls: [
    {
      id: 'w1',
      start: { x: 100, y: 100 },
      end: { x: 300, y: 100 },
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
  labels: [{ id: 'l1', text: 'Kitchen', position: { x: 200, y: 80 } }],
  dimensions: [{ id: 'd1', start: { x: 100, y: 120 }, end: { x: 300, y: 120 } }],
  lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 0.8 },
  gridSize: 20,
};

describe('buildFloorPlanSvg', () => {
  it('includes walls, openings, labels, and dimensions', () => {
    const svg = buildFloorPlanSvg(baseManifest);
    expect(svg).toContain('<line');
    expect(svg).toContain('#C85A54');
    expect(svg).toContain('Kitchen');
    expect(svg).toContain('#B8941F');
  });

  it('omits dimensions when dimensionVisibility is false', () => {
    const svg = buildFloorPlanSvg({ ...baseManifest, dimensionVisibility: false });
    expect(svg).not.toContain('#B8941F');
  });
});
