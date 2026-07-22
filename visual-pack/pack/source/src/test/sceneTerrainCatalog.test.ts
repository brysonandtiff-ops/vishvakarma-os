import { describe, expect, it } from 'vitest';
import type { TerrainPatch } from '@/types';
import {
  buildTerrainShapePoints,
  formatTerrainElevation,
  getPolygonCentroid,
  getTerrainElevationPreset,
  isValidTerrainPolygon,
  pointsNear,
  polygonArea,
  TERRAIN_ELEVATION_PRESETS,
} from '@/core/sceneTerrainCatalog';

describe('sceneTerrainCatalog', () => {
  it('formats elevation labels', () => {
    expect(formatTerrainElevation(0)).toBe('Grade');
    expect(formatTerrainElevation(60)).toBe('60 cm');
    expect(formatTerrainElevation(100)).toBe('1 m');
    expect(formatTerrainElevation(150)).toBe('1.5 m');
  });

  it('computes centroid and area', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 10, y: 20 },
    ];
    expect(getPolygonCentroid(triangle)).toEqual({ x: 10, y: 20 / 3 });
    expect(polygonArea(triangle)).toBe(200);
  });

  it('validates terrain polygons', () => {
    const valid = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ];
    expect(isValidTerrainPolygon(valid)).toBe(true);
    expect(isValidTerrainPolygon([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toBe(false);
  });

  it('detects nearby points for polygon close', () => {
    expect(pointsNear({ x: 0, y: 0 }, { x: 8, y: 6 })).toBe(true);
    expect(pointsNear({ x: 0, y: 0 }, { x: 20, y: 0 })).toBe(false);
  });

  it('cycles elevation presets', () => {
    expect(TERRAIN_ELEVATION_PRESETS.length).toBe(5);
    expect(getTerrainElevationPreset(0)).toBe(0);
    expect(getTerrainElevationPreset(6)).toBe(30);
    expect(getTerrainElevationPreset(7)).toBe(60);
  });

  it('maps canvas points to world shape coordinates', () => {
    const patch: TerrainPatch = {
      id: 't1',
      elevation: 60,
      points: [
        { x: 600, y: 400 },
        { x: 700, y: 400 },
        { x: 650, y: 500 },
      ],
    };
    const shapePoints = buildTerrainShapePoints(patch);
    expect(shapePoints[0]).toEqual({ x: 0, z: 0 });
    expect(shapePoints[1].x).toBeCloseTo(1);
    expect(shapePoints[2].z).toBeCloseTo(1);
  });
});
