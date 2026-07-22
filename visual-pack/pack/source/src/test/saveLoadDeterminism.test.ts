import { describe, expect, it } from 'vitest';
import { createProjectManifest } from '@/core/projectModel';
import { roundTripProjectManifest } from '@/core/projectExport';
import type { ProjectManifest } from '@/types';

function buildFullManifest(): ProjectManifest {
  return createProjectManifest({
    name: 'Determinism Test',
    walls: [
      {
        id: 'wall-1',
        start: { x: 100, y: 100 },
        end: { x: 300, y: 100 },
        thickness: 10,
        height: 240,
        material: 'material-paint',
      },
    ],
    openings: [
      {
        id: 'door-1',
        type: 'door',
        wallId: 'wall-1',
        position: 0.5,
        width: 90,
        height: 210,
      },
    ],
  });
}

describe('save/load determinism', () => {
  it('round-trips full manifest through JSON serialize/parse', () => {
    const manifest = buildFullManifest();
    manifest.labels = [{ id: 'l1', text: 'Kitchen', position: { x: 200, y: 90 }, fontSize: 14 }];
    manifest.dimensions = [{ id: 'd1', start: { x: 100, y: 100 }, end: { x: 300, y: 100 }, offset: 24 }];
    manifest.furniture = [{ id: 'f1', type: 'table', position: { x: 200, y: 200 }, width: 120, depth: 80 }];
    manifest.materials = [{ id: 'm1', name: 'Custom', type: 'custom', color: '#abc', roughness: 0.5 }];

    const result = roundTripProjectManifest(manifest);
    expect(result.ok).toBe(true);
    expect(result.manifest).toEqual(manifest);
  });
});
