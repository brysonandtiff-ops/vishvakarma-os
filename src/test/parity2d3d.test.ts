import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProjectManifestJson } from '@/core/projectExport';
import { computeSceneOrigin } from '@/core/sceneVisualCatalog';
import { detectRoomAtPoint, getVerticesForRoom } from '@/utils/roomCalculations';

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

  it('computeSceneOrigin centers on active wall bounding box', () => {
    const walls = [
      { id: 'w1', start: { x: 100, y: 200 }, end: { x: 500, y: 200 }, thickness: 10, height: 300 },
      { id: 'w2', start: { x: 500, y: 200 }, end: { x: 500, y: 600 }, thickness: 10, height: 300 },
    ];
    const origin = computeSceneOrigin(walls);
    expect(origin.cx).toBe(300);
    expect(origin.cy).toBe(400);
  });

  it('showcase walls yield enclosed room geometry for 3D room volumes', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/full-feature-showcase.json');
    const parsed = parseProjectManifestJson(readFileSync(samplePath, 'utf8'));
    expect(parsed.ok).toBe(true);
    const manifest = parsed.manifest!;
    expect(manifest.walls.length).toBeGreaterThanOrEqual(4);

    const center = {
      x: (manifest.walls[0].start.x + manifest.walls[0].end.x) / 2,
      y: (manifest.walls[0].start.y + manifest.walls[0].end.y) / 2,
    };
    const detected = detectRoomAtPoint(manifest.walls, center);
    expect(detected).not.toBeNull();
    expect(detected!.center).toBeDefined();
    expect((detected!.area ?? 0)).toBeGreaterThan(0);

    const vertices = getVerticesForRoom(detected!, manifest.walls);
    expect(vertices.length).toBeGreaterThanOrEqual(3);
    const areaPx =
      vertices.reduce((sum, v, i) => {
        const next = vertices[(i + 1) % vertices.length];
        return sum + v.x * next.y - next.x * v.y;
      }, 0) / 2;
    expect(Math.abs(areaPx)).toBeGreaterThan(0);
    const centroid = detected!.center!;
    expect(Number.isFinite(centroid.x)).toBe(true);
    expect(Number.isFinite(centroid.y)).toBe(true);
  });

  it('showcase includes multi-floor walls for stacked 3D demo', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/full-feature-showcase.json');
    const parsed = parseProjectManifestJson(readFileSync(samplePath, 'utf8'));
    expect(parsed.ok).toBe(true);
    const manifest = parsed.manifest!;
    expect(manifest.floors?.length).toBeGreaterThanOrEqual(2);
    const upperFloorWalls = manifest.walls.filter((w) => (w.floorIndex ?? 0) === 1);
    expect(upperFloorWalls.length).toBeGreaterThanOrEqual(4);
  });

  it('furniture and landscape showcase elements have finite placement data', () => {
    for (const file of ['furniture-showcase.json', 'landscape-garden.json', 'terrain-garden.json'] as const) {
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

      for (const patch of manifest.terrain ?? []) {
        expect(patch.points.length).toBeGreaterThanOrEqual(3);
        expect(patch.elevation).toBeGreaterThanOrEqual(0);
        for (const point of patch.points) {
          expect(Number.isFinite(point.x)).toBe(true);
          expect(Number.isFinite(point.y)).toBe(true);
        }
      }
    }
  });
});
