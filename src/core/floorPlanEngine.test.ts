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
});
