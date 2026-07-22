import { describe, expect, it } from 'vitest';
import { setbackRule } from '@/rules/zoning/setbackRule';
import type { Project, ProjectManifest } from '@/types';

function setbackViolationManifest(): ProjectManifest {
  return {
    version: '1.0.0',
    name: 'Setback Violation',
    walls: [],
    openings: [],
    materials: [],
    floorMaterial: 'material-wood',
    lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
    gridSize: 20,
    snapToGrid: true,
    metadata: {
      created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z',
      aiDesigner: {
        sitePlan: {
          parcelBoundary: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
          buildingFootprint: [
            { x: 10, y: 10 },
            { x: 110, y: 10 },
            { x: 110, y: 50 },
            { x: 10, y: 50 },
          ],
          setbacks: { front: 3, side: 1.5, rear: 3 },
          orientation: 'north',
        },
      },
    },
  };
}

describe('SetbackRule', () => {
  it('returns fail when building footprint extends beyond parcel', () => {
    const project: Project = {
      id: 'test',
      name: 'Setback Violation',
      manifest: setbackViolationManifest(),
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = setbackRule.validate(project);
    expect(result.status).toBe('fail');
    expect(result.findings[0]?.message).toMatch(/Setback violation/i);
  });

  it('returns warning when no site plan exists', () => {
    const project: Project = {
      id: 'test',
      name: 'Manual Project',
      manifest: {
        version: '1.0.0',
        name: 'Manual Project',
        walls: [],
        openings: [],
        materials: [],
        floorMaterial: 'material-wood',
        lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
        gridSize: 20,
        snapToGrid: true,
        metadata: { created: '2026-01-01T00:00:00Z', modified: '2026-01-01T00:00:00Z' },
      },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = setbackRule.validate(project);
    expect(result.status).toBe('warning');
  });
});
