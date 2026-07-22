import { describe, expect, it } from 'vitest';
import { bedroomSizeRule } from '@/rules/ncc/bedroomSizeRule';
import type { Project, ProjectManifest } from '@/types';

function smallBedroomManifest(): ProjectManifest {
  return {
    version: '1.0.0',
    name: 'Small Bedroom Test',
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 45, y: 0 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w2', start: { x: 45, y: 0 }, end: { x: 45, y: 45 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w3', start: { x: 45, y: 45 }, end: { x: 0, y: 45 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w4', start: { x: 0, y: 45 }, end: { x: 0, y: 0 }, thickness: 10, height: 240, material: 'material-concrete' },
    ],
    openings: [],
    rooms: [{ id: 'bed-1', name: 'Bedroom 1', wallIds: ['w1', 'w2', 'w3', 'w4'] }],
    materials: [],
    floorMaterial: 'material-wood',
    lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
    gridSize: 20,
    snapToGrid: true,
    metadata: { created: '2026-01-01T00:00:00Z', modified: '2026-01-01T00:00:00Z' },
  };
}

describe('BedroomSizeRule', () => {
  it('returns fail when bedroom area is below 6.5 m²', () => {
    const project: Project = {
      id: 'test',
      name: 'Small Bedroom Test',
      manifest: smallBedroomManifest(),
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = bedroomSizeRule.validate(project);
    expect(result.status).toBe('fail');
    expect(result.findings.some((f) => f.status === 'fail' && f.field === 'area')).toBe(true);
    expect(result.findings.some((f) => f.status === 'fail' && f.field === 'width')).toBe(true);
  });
});
