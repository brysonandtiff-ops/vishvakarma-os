import { describe, it, expect, beforeEach } from 'vitest';
import { FloorPlanEngine } from './floorPlanEngine';

describe('FloorPlanEngine', () => {
  beforeEach(() => {
    FloorPlanEngine.resetInstance();
  });

  it('adds walls and supports undo', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.addWall({
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 200,
      height: 2800,
      material: 'material-concrete',
    });
    expect(engine.getWalls()).toHaveLength(1);
    expect(engine.getSnapshot().canUndo).toBe(true);
    engine.undo();
    expect(engine.getWalls()).toHaveLength(0);
  });

  it('buildManifest uses session project name', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.setProjectMeta('Test House');
    expect(engine.buildManifest().name).toBe('Test House');
  });

  it('adds furniture and recalculates cost items', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.addWall({
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 200, y: 0 },
      thickness: 10,
      height: 240,
      material: 'material-paint',
    });
    engine.addFurniture({
      id: 'f1',
      type: 'bed',
      position: { x: 100, y: 100 },
      width: 140,
      depth: 200,
    });

    expect(engine.getFurniture()).toHaveLength(1);
    expect(engine.getCostItems().length).toBeGreaterThan(0);
  });

  it('sets north orientation on manifest', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.setNorthOrientation(135);
    expect(engine.getNorthOrientation()).toBe(135);
  });

  it('updates and removes labels', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.addLabel({ id: 'l1', text: 'Room', position: { x: 10, y: 10 } });
    engine.updateLabel('l1', { text: 'Kitchen', fontSize: 18 });
    expect(engine.getLabels()[0].text).toBe('Kitchen');
    engine.removeLabel('l1');
    expect(engine.getLabels()).toHaveLength(0);
  });

  it('toggles dimension visibility', () => {
    const engine = FloorPlanEngine.getInstance();
    expect(engine.getDimensionVisibility()).toBe(true);
    engine.setDimensionVisibility(false);
    expect(engine.getDimensionVisibility()).toBe(false);
    expect(engine.buildManifest().dimensionVisibility).toBe(false);
  });

  it('manages lighting fixtures', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.addFixture({ id: 'fx1', type: 'point', position: { x: 100, y: 200 }, intensity: 1 });
    expect(engine.buildManifest().fixtures).toHaveLength(1);
    engine.updateFixture('fx1', { type: 'spot', intensity: 1.5 });
    expect(engine.buildManifest().fixtures?.[0].type).toBe('spot');
    expect(engine.buildManifest().fixtures?.[0].intensity).toBe(1.5);
    engine.removeFixture('fx1');
    expect(engine.buildManifest().fixtures).toHaveLength(0);
  });

  it('panning bumps viewport revision without geometry revision', () => {
    const engine = FloorPlanEngine.getInstance();
    const geometryBefore = engine.getGeometryRevision();
    const viewportBefore = engine.getViewportRevision();
    engine.setCanvasViewport({ panX: 40, panY: -20 });
    expect(engine.getGeometryRevision()).toBe(geometryBefore);
    expect(engine.getViewportRevision()).toBeGreaterThan(viewportBefore);
  });

  it('coalesces undo snapshots during edit transactions', () => {
    const engine = FloorPlanEngine.getInstance();
    engine.addWall({
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 200,
      height: 2800,
      material: 'material-concrete',
    });
    engine.beginEditTransaction();
    engine.updateWall('w1', { start: { x: 5, y: 0 } });
    engine.updateWall('w1', { start: { x: 10, y: 0 } });
    engine.commitEditTransaction();
    engine.undo();
    expect(engine.getWalls()[0]?.start.x).toBe(0);
  });
});
