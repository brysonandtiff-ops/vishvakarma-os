import { describe, expect, it } from 'vitest';
import { diffManifestIntents, snapshotManifestForDiff } from '@/cast/CastIntentRelay';
import type { ProjectManifest } from '@/types';

const baseManifest = (): ProjectManifest => ({
  version: '1.0.0',
  name: 'Test',
  walls: [
    {
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 10,
      material: 'material-brick',
    },
  ],
  openings: [],
  materials: [],
  floorMaterial: 'material-concrete',
  lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
  gridSize: 20,
  snapToGrid: true,
  metadata: { created: '2026-01-01', modified: '2026-01-01' },
});

describe('CastIntentRelay', () => {
  it('detects wall geometry changes', () => {
    const before = snapshotManifestForDiff(baseManifest());
    const moved = baseManifest();
    moved.walls[0] = { ...moved.walls[0], end: { x: 120, y: 0 } };
    const after = snapshotManifestForDiff(moved);
    const events = diffManifestIntents(before, after, moved);
    expect(events.some((event) => event.type === 'walls')).toBe(true);
  });

  it('detects solar timeline changes', () => {
    const before = snapshotManifestForDiff(baseManifest());
    const updated = baseManifest();
    updated.lighting = { ...updated.lighting, timeOfDay: 18 };
    const after = snapshotManifestForDiff(updated);
    const events = diffManifestIntents(before, after, updated);
    expect(events.some((event) => event.type === 'lighting')).toBe(true);
  });
});
