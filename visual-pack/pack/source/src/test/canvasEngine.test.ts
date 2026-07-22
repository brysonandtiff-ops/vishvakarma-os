/**
 * Canvas Engine Tests
 * 
 * Tests for the Canvas Engine module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasEngine, createCanvasEngine } from '@/modules/canvasEngine';
import type { Wall, Opening } from '@/types';

describe('CanvasEngine', () => {
  let engine: CanvasEngine;

  beforeEach(() => {
    engine = createCanvasEngine({
      walls: [],
      openings: [],
      currentTool: 'select',
      gridVisible: true,
      snapEnabled: true,
    });
  });

  describe('Wall Operations', () => {
    it('should add a valid wall', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      const result = await engine.addWall(wall);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(engine.getState().walls).toHaveLength(1);
    });

    it('should reject zero-length wall', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      const result = await engine.addWall(wall);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(engine.getState().walls).toHaveLength(0);
    });

    it('should remove a wall', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      await engine.addWall(wall);
      const result = await engine.removeWall('wall-1');

      expect(result.valid).toBe(true);
      expect(engine.getState().walls).toHaveLength(0);
    });

    it('should update a wall', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      await engine.addWall(wall);

      const updatedWall: Wall = {
        ...wall,
        thickness: 20,
      };

      const result = await engine.updateWall(updatedWall);

      expect(result.valid).toBe(true);
      expect(engine.getState().walls[0].thickness).toBe(20);
    });
  });

  describe('Opening Operations', () => {
    beforeEach(async () => {
      // Add a wall first
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };
      await engine.addWall(wall);
    });

    it('should add a valid opening', async () => {
      const opening: Opening = {
        id: 'opening-1',
        wallId: 'wall-1',
        type: 'door',
        position: 0.5,
        width: 90,
        height: 210,
      };

      const result = await engine.addOpening(opening);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(engine.getState().openings).toHaveLength(1);
    });

    it('should reject opening on non-existent wall', async () => {
      const opening: Opening = {
        id: 'opening-1',
        wallId: 'wall-999',
        type: 'door',
        position: 0.5,
        width: 90,
        height: 210,
      };

      const result = await engine.addOpening(opening);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(engine.getState().openings).toHaveLength(0);
    });

    it('should remove an opening', async () => {
      const opening: Opening = {
        id: 'opening-1',
        wallId: 'wall-1',
        type: 'door',
        position: 0.5,
        width: 90,
        height: 210,
      };

      await engine.addOpening(opening);
      const result = await engine.removeOpening('opening-1');

      expect(result.valid).toBe(true);
      expect(engine.getState().openings).toHaveLength(0);
    });

    it('should remove openings when wall is removed', async () => {
      const opening: Opening = {
        id: 'opening-1',
        wallId: 'wall-1',
        type: 'door',
        position: 0.5,
        width: 90,
        height: 210,
      };

      await engine.addOpening(opening);
      await engine.removeWall('wall-1');

      expect(engine.getState().walls).toHaveLength(0);
      expect(engine.getState().openings).toHaveLength(0);
    });
  });

  describe('Lock/Unlock', () => {
    it('should lock and unlock canvas', () => {
      expect(engine.isLocked()).toBe(false);

      engine.lock();
      expect(engine.isLocked()).toBe(true);

      engine.unlock();
      expect(engine.isLocked()).toBe(false);
    });

    it('should reject operations when locked', async () => {
      engine.lock();

      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      const result = await engine.addWall(wall);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Canvas is locked. Cannot execute operation.');
    });
  });

  describe('Validation', () => {
    it('should validate current state', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      await engine.addWall(wall);

      const validation = engine.validateCurrentState();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect orphaned openings', async () => {
      // Create a new engine with orphaned opening state
      const engineWithOrphan = createCanvasEngine({
        walls: [],
        openings: [
          {
            id: 'opening-1',
            wallId: 'wall-999',
            type: 'door',
            position: 0.5,
            width: 90,
            height: 210,
          },
        ],
        currentTool: 'select',
        gridVisible: true,
        snapEnabled: true,
      });

      const validation = engineWithOrphan.validateCurrentState();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('orphaned'))).toBe(true);
    });
  });

  describe('Operation History', () => {
    it('should track operation history', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      await engine.addWall(wall);

      const history = engine.getOperationHistory();

      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('add-wall');
    });

    it('should clear operation history', async () => {
      const wall: Wall = {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 10,
        material: "material-paint",
        height: 300,
      };

      await engine.addWall(wall);
      engine.clearOperationHistory();

      const history = engine.getOperationHistory();

      expect(history).toHaveLength(0);
    });
  });
});
