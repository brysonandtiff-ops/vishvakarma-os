import {
  DEFAULT_FLOOR_MATERIAL,
  DEFAULT_GRID_SIZE,
  DEFAULT_PROJECT_LIGHTING,
  PROJECT_SPEC_VERSION,
  createEmptyProjectManifest,
  createProjectManifest,
  isProjectManifest,
  summarizeProjectManifest,
} from './projectModel';
import type { Opening, Wall } from '@/types';

const wall: Wall = {
  id: 'wall-1',
  start: { x: 0, y: 0 },
  end: { x: 400, y: 0 },
  thickness: 10,
  height: 240,
  material: 'material-paint',
};

const opening: Opening = {
  id: 'door-1',
  type: 'door',
  wallId: 'wall-1',
  position: 0.5,
  width: 90,
  height: 210,
};

describe('projectModel', () => {
  it('creates an empty canonical project manifest with defaults', () => {
    const manifest = createEmptyProjectManifest('  Test House  ', 'Demo project');

    expect(manifest.version).toBe(PROJECT_SPEC_VERSION);
    expect(manifest.name).toBe('Test House');
    expect(manifest.description).toBe('Demo project');
    expect(manifest.walls).toEqual([]);
    expect(manifest.openings).toEqual([]);
    expect(manifest.materials).toEqual([]);
    expect(manifest.floorMaterial).toBe(DEFAULT_FLOOR_MATERIAL);
    expect(manifest.lighting).toEqual(DEFAULT_PROJECT_LIGHTING);
    expect(manifest.gridSize).toBe(DEFAULT_GRID_SIZE);
    expect(manifest.snapToGrid).toBe(true);
    expect(manifest.metadata.created).toEqual(manifest.metadata.modified);
  });

  it('normalizes blank names and invalid timestamps safely', () => {
    const manifest = createProjectManifest({
      name: '   ',
      createdAt: 'not-a-date',
      modifiedAt: 'also-not-a-date',
    });

    expect(manifest.name).toBe('Untitled Project');
    expect(() => new Date(manifest.metadata.created).toISOString()).not.toThrow();
    expect(() => new Date(manifest.metadata.modified).toISOString()).not.toThrow();
  });

  it('preserves geometry, lighting, materials, and snap settings', () => {
    const manifest = createProjectManifest({
      name: 'Geometry Proof',
      walls: [wall],
      openings: [opening],
      materials: [{
        id: 'material-wood',
        name: 'Wood',
        type: 'wood',
        color: '#8B5E3C',
        roughness: 0.55,
      }],
      lighting: {
        sunAzimuth: 90,
        sunElevation: 30,
        timeOfDay: 8,
        intensity: 0.7,
      },
      snapToGrid: false,
      gridSize: 25,
      createdAt: '2026-05-25T00:00:00.000Z',
      modifiedAt: '2026-05-25T01:00:00.000Z',
    });

    expect(manifest.walls).toEqual([wall]);
    expect(manifest.openings).toEqual([opening]);
    expect(manifest.materials).toHaveLength(1);
    expect(manifest.lighting.sunAzimuth).toBe(90);
    expect(manifest.snapToGrid).toBe(false);
    expect(manifest.gridSize).toBe(25);
    expect(manifest.metadata.created).toBe('2026-05-25T00:00:00.000Z');
    expect(manifest.metadata.modified).toBe('2026-05-25T01:00:00.000Z');
  });

  it('summarizes manifest proof data for save/export gates', () => {
    const manifest = createProjectManifest({
      name: 'Summary Proof',
      walls: [wall],
      openings: [opening],
    });

    expect(summarizeProjectManifest(manifest)).toEqual({
      wallCount: 1,
      openingCount: 1,
      materialCount: 0,
      hasGeometry: true,
      snapToGrid: true,
      gridSize: DEFAULT_GRID_SIZE,
      lighting: DEFAULT_PROJECT_LIGHTING,
    });
  });

  it('validates canonical project manifest shape', () => {
    const manifest = createProjectManifest({ name: 'Valid Manifest' });

    expect(isProjectManifest(manifest)).toBe(true);
    expect(isProjectManifest({ ...manifest, walls: null })).toBe(false);
    expect(isProjectManifest({ ...manifest, snapToGrid: 'yes' })).toBe(false);
    expect(isProjectManifest(null)).toBe(false);
  });
});
