import { describe, it, expect } from 'vitest';
import { createEmptyProjectManifest } from '@/core/projectModel';
import { ManifestCollabBridge } from '@/collaboration/crdt/manifestBridge';
import type { Wall } from '@/types';

describe('manifestBridge CRDT', () => {
  it('encodes and restores collaborative wall state', () => {
    const bridge = new ManifestCollabBridge(createEmptyProjectManifest('Collab Test'));
    const restored = new ManifestCollabBridge(createEmptyProjectManifest('Collab Test'));

    bridge.applyPartial({
      walls: [
        {
          id: 'wall-a',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 20,
          height: 280,
          material: 'material-concrete',
        },
        {
          id: 'wall-b',
          start: { x: 0, y: 100 },
          end: { x: 100, y: 100 },
          thickness: 20,
          height: 280,
          material: 'material-concrete',
        },
      ],
    });

    restored.applyEncodedState(bridge.encodeState());
    const manifest = restored.toManifest();

    expect(manifest.walls).toHaveLength(2);
    expect(manifest.walls.map((wall) => wall.id).sort()).toEqual(['wall-a', 'wall-b']);
  });

  it('applies local partial edits through ManifestCollabBridge', () => {
    const bridge = new ManifestCollabBridge(createEmptyProjectManifest('Bridge Test'));
    bridge.setActive(true);

    bridge.applyPartial({
      walls: [
        {
          id: 'wall-1',
          start: { x: 0, y: 0 },
          end: { x: 50, y: 0 },
          thickness: 20,
          height: 280,
          material: 'material-concrete',
        },
      ],
    });

    const manifest = bridge.toManifest();
    expect(manifest.walls).toHaveLength(1);
    expect(manifest.walls[0].id).toBe('wall-1');
  });

  it('round-trips rooms, windows, and annotations', () => {
    const bridge = new ManifestCollabBridge(createEmptyProjectManifest('Entities'));
    bridge.applyPartial({
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 20,
          height: 280,
          material: 'material-concrete',
        },
      ],
      rooms: [{ id: 'r1', name: 'Kitchen', wallIds: ['w1'] }],
      openings: [
        {
          id: 'o1',
          type: 'window',
          wallId: 'w1',
          position: 0.5,
          width: 90,
          height: 120,
        },
      ],
      dimensions: [{ id: 'd1', start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }],
      labels: [{ id: 'l1', text: 'North', position: { x: 10, y: 10 } }],
      roofs: [
        {
          id: 'roof1',
          footprint: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
          pitch: 30,
          material: 'material-concrete',
        },
      ],
    });

    const manifest = bridge.toManifest();
    expect(manifest.rooms).toHaveLength(1);
    expect(manifest.openings).toHaveLength(1);
    expect(manifest.dimensions).toHaveLength(1);
    expect(manifest.labels).toHaveLength(1);
    expect(manifest.roofs).toHaveLength(1);
  });
});
