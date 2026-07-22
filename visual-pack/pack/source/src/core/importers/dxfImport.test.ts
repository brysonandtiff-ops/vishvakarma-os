import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importDxfToManifest } from '@/core/importers/dxfImport';

describe('importDxfToManifest', () => {
  it('imports closed LWPOLYLINE as four wall segments', () => {
    const fixturePath = resolve(process.cwd(), 'src/test/fixtures/dxf-lwpolyline-sample.dxf');
    const content = readFileSync(fixturePath, 'utf8');
    const { manifest, warnings, stats } = importDxfToManifest(content, 'Polyline Sample');

    expect(manifest.walls.length).toBe(4);
    expect(warnings.length).toBeGreaterThan(0);
    expect(stats.segmentsImported).toBe(4);
    for (const wall of manifest.walls) {
      expect(Number.isFinite(wall.start.x)).toBe(true);
      expect(Number.isFinite(wall.end.x)).toBe(true);
    }
  });

  it('filters non-wall layers and reports import stats', () => {
    const fixturePath = resolve(process.cwd(), 'src/test/fixtures/dxf-layer-filter-sample.dxf');
    const content = readFileSync(fixturePath, 'utf8');
    const { manifest, stats, warnings } = importDxfToManifest(content, 'Layer Filter');

    expect(manifest.walls.length).toBe(4);
    expect(stats.layersImported).toContain('A-WALL');
    expect(stats.layersSkipped).toContain('A-DIM');
    expect(stats.segmentsSkipped).toBe(1);
    expect(warnings.some((w) => w.includes('Skipped layers'))).toBe(true);
  });
});
