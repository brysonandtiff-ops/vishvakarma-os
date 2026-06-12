import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProjectManifestJson } from '@/core/projectExport';

describe('2D/3D parity', () => {
  it('sample project wall and opening counts match manifest', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/sample-house-01.json');
    const raw = readFileSync(samplePath, 'utf8');
    const parsed = parseProjectManifestJson(raw);
    expect(parsed.ok).toBe(true);

    const manifest = parsed.manifest!;
    expect(manifest.walls.length).toBe(4);
    expect(manifest.openings.length).toBe(3);

    for (const opening of manifest.openings) {
      const wall = manifest.walls.find((w) => w.id === opening.wallId);
      expect(wall).toBeDefined();
      expect(opening.position).toBeGreaterThanOrEqual(0);
      expect(opening.position).toBeLessThanOrEqual(1);
    }
  });

  it('wall coordinates are finite for 3D extrusion', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/sample-house-01.json');
    const parsed = parseProjectManifestJson(readFileSync(samplePath, 'utf8'));
    const manifest = parsed.manifest!;

    for (const wall of manifest.walls) {
      expect(Number.isFinite(wall.start.x)).toBe(true);
      expect(Number.isFinite(wall.end.x)).toBe(true);
      expect(wall.height).toBeGreaterThan(0);
      expect(wall.thickness).toBeGreaterThan(0);
    }
  });

  it('furniture and landscape showcase elements have finite placement data', () => {
    for (const file of ['furniture-showcase.json', 'landscape-garden.json'] as const) {
      const samplePath = resolve(process.cwd(), 'public/samples', file);
      const parsed = parseProjectManifestJson(readFileSync(samplePath, 'utf8'));
      expect(parsed.ok).toBe(true);
      const manifest = parsed.manifest!;

      for (const item of manifest.furniture ?? []) {
        expect(Number.isFinite(item.position.x)).toBe(true);
        expect(Number.isFinite(item.position.y)).toBe(true);
        expect((item.width ?? 0)).toBeGreaterThan(0);
        expect((item.depth ?? 0)).toBeGreaterThan(0);
        if (item.modelScale !== undefined) {
          expect(Number.isFinite(item.modelScale)).toBe(true);
        }
        if (item.modelUrl !== undefined) {
          expect(item.modelUrl.length).toBeGreaterThan(0);
        }
      }

      for (const element of manifest.landscapeElements ?? []) {
        expect(Number.isFinite(element.position.x)).toBe(true);
        expect(Number.isFinite(element.position.y)).toBe(true);
        if (element.modelScale !== undefined) {
          expect(Number.isFinite(element.modelScale)).toBe(true);
        }
      }
    }
  });
});
