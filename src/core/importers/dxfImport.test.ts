import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importDxfToManifest } from '@/core/importers/dxfImport';

describe('importDxfToManifest', () => {
  it('imports closed LWPOLYLINE as four wall segments', () => {
    const fixturePath = resolve(process.cwd(), 'src/test/fixtures/dxf-lwpolyline-sample.dxf');
    const content = readFileSync(fixturePath, 'utf8');
    const { manifest, warnings } = importDxfToManifest(content, 'Polyline Sample');

    expect(manifest.walls.length).toBe(4);
    expect(warnings.length).toBeGreaterThan(0);
    for (const wall of manifest.walls) {
      expect(Number.isFinite(wall.start.x)).toBe(true);
      expect(Number.isFinite(wall.end.x)).toBe(true);
    }
  });
});
