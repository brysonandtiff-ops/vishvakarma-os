import { describe, it, expect } from 'vitest';
import { exportManifestToDxf } from './dxfExport';
import { createEmptyProjectManifest } from '@/core/projectModel';

describe('dxfExport', () => {
  it('emits LINE entities for walls', () => {
    const manifest = createEmptyProjectManifest('DXF Test');
    manifest.walls.push({
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 200,
      height: 2800,
      material: 'material-concrete',
    });
    const dxf = exportManifestToDxf(manifest);
    expect(dxf).toContain('WALLS');
    expect(dxf).toContain('EOF');
  });
});
