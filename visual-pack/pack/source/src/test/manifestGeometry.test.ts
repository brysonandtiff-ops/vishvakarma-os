import { describe, expect, it } from 'vitest';
import { createProjectManifest } from '@/core/projectModel';
import { scaleManifestGeometry } from '@/utils/manifestGeometry';

describe('scaleManifestGeometry', () => {
  it('scales wall geometry around centroid', () => {
    const manifest = createProjectManifest({
      name: 'Scale test',
      walls: [
        {
          id: 'w1',
          start: { x: 100, y: 100 },
          end: { x: 200, y: 100 },
          thickness: 10,
          height: 240,
          material: 'material-paint',
        },
        {
          id: 'w2',
          start: { x: 200, y: 100 },
          end: { x: 200, y: 200 },
          thickness: 10,
          height: 240,
          material: 'material-paint',
        },
      ],
    });

    const scaled = scaleManifestGeometry(manifest, 2);
    const spanX = scaled.walls[0].end.x - scaled.walls[0].start.x;
    expect(spanX).toBeGreaterThan(150);
  });
});
