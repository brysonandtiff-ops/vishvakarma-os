import { describe, expect, it } from 'vitest';
import { createEmptyProjectManifest } from '@/core/projectModel';
import {
  createFloor,
  ensureDefaultFloors,
  floorElevationMeters,
  filterOpeningsByFloor,
  filterWallsByFloor,
  getActiveFloor,
} from './floorHelpers';

describe('floorHelpers', () => {
  it('ensures a default ground floor on empty manifests', () => {
    const manifest = ensureDefaultFloors(createEmptyProjectManifest('Test'));
    expect(manifest.floors).toHaveLength(1);
    expect(manifest.floors?.[0]?.name).toBe('Ground Floor');
    expect(manifest.activeFloorIndex).toBe(0);
  });

  it('filters walls and openings by floor index', () => {
    const manifest = ensureDefaultFloors(createEmptyProjectManifest('Multi'));
    const walls = [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 10, height: 120, material: 'm1', floorIndex: 0 },
      { id: 'w2', start: { x: 0, y: 100 }, end: { x: 100, y: 100 }, thickness: 10, height: 120, material: 'm1', floorIndex: 1 },
    ];
    const openings = [
      { id: 'o1', type: 'door' as const, wallId: 'w1', position: 0.5, width: 36, height: 84 },
      { id: 'o2', type: 'window' as const, wallId: 'w2', position: 0.5, width: 36, height: 48 },
    ];

    expect(filterWallsByFloor(walls, 0).map((w) => w.id)).toEqual(['w1']);
    expect(filterOpeningsByFloor(openings, walls, 1).map((o) => o.id)).toEqual(['o2']);
  });

  it('creates named floors with stable ids', () => {
    const floor = createFloor('First Floor', 3.2, 1);
    expect(floor.name).toBe('First Floor');
    expect(floor.elevation).toBe(3.2);
    expect(floor.id).toContain('first-floor');
  });

  it('returns the active floor entry', () => {
    const manifest = ensureDefaultFloors(createEmptyProjectManifest('Active'));
    expect(getActiveFloor(manifest).name).toBe('Ground Floor');
  });

  it('maps floor elevation cm to meters for 3D stacking', () => {
    expect(floorElevationMeters(280)).toBe(2.8);
    expect(floorElevationMeters(0)).toBe(0);
  });
});
