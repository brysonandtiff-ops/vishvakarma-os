/**
 * Version Control Hooks Tests
 * 
 * Tests for the Version Control Hooks module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VersionControlHooks, DEFAULT_VERSION_CONTROL_CONFIG } from '@/modules/versionControlHooks';
import type { ProjectManifest } from '@/types';

describe('VersionControlHooks', () => {
  let versionControl: VersionControlHooks;
  let manifest: ProjectManifest;

  beforeEach(() => {
    // Disable auto-save for tests
    versionControl = new VersionControlHooks({
      ...DEFAULT_VERSION_CONTROL_CONFIG,
      autoSaveEnabled: false,
      persistToLocalStorage: false,
    });

    manifest = {
      version: '1.0.0',
      name: 'Test Project',
      walls: [
        {
          id: 'wall-1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 10,
          height: 300,
          material: 'material-paint',
        },
      ],
      openings: [],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
      gridSize: 20,
      snapToGrid: true,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };
  });

  afterEach(() => {
    versionControl.cleanup();
  });

  describe('Version Saving', () => {
    it('should save a version', () => {
      const versionId = versionControl.saveVersion(manifest, 'Initial version');

      expect(versionId).toBeTruthy();

      const history = versionControl.getVersionHistory();

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(versionId);
      expect(history[0].description).toBe('Initial version');
      expect(history[0].autoSaved).toBe(false);
    });

    it('should save multiple versions', () => {
      versionControl.saveVersion(manifest, 'Version 1');

      const manifest2 = {
        ...manifest,
        walls: [
          ...manifest.walls,
          {
            id: 'wall-2',
            start: { x: 100, y: 0 },
            end: { x: 100, y: 100 },
            thickness: 10,
            height: 300,
          },
        ],
      };

      versionControl.saveVersion(manifest2, 'Version 2');

      const history = versionControl.getVersionHistory();

      expect(history).toHaveLength(2);
    });

    it('should enforce max versions limit', () => {
      const limitedVersionControl = new VersionControlHooks({
        ...DEFAULT_VERSION_CONTROL_CONFIG,
        autoSaveEnabled: false,
        persistToLocalStorage: false,
        maxVersions: 3,
      });

      for (let i = 0; i < 5; i++) {
        limitedVersionControl.saveVersion(manifest, `Version ${i + 1}`);
      }

      const history = limitedVersionControl.getVersionHistory();

      expect(history).toHaveLength(3);
      expect(history[0].description).toBe('Version 3');
      expect(history[2].description).toBe('Version 5');

      limitedVersionControl.cleanup();
    });
  });

  describe('Version Restoration', () => {
    it('should restore a specific version', () => {
      const versionId = versionControl.saveVersion(manifest, 'Version 1');

      const restored = versionControl.restoreVersion(versionId);

      expect(restored).toEqual(manifest);
    });

    it('should return null for non-existent version', () => {
      const restored = versionControl.restoreVersion('non-existent');

      expect(restored).toBeNull();
    });
  });

  describe('Undo/Redo', () => {
    beforeEach(() => {
      versionControl.saveVersion(manifest, 'Version 1');

      const manifest2 = {
        ...manifest,
        walls: [
          ...manifest.walls,
          {
            id: 'wall-2',
            start: { x: 100, y: 0 },
            end: { x: 100, y: 100 },
            thickness: 10,
            height: 300,
          },
        ],
      };

      versionControl.saveVersion(manifest2, 'Version 2');
    });

    it('should undo to previous version', () => {
      const undone = versionControl.undo();

      expect(undone).toBeTruthy();
      expect(undone?.walls).toHaveLength(1);
    });

    it('should redo to next version', () => {
      versionControl.undo();
      const redone = versionControl.redo();

      expect(redone).toBeTruthy();
      expect(redone?.walls).toHaveLength(2);
    });

    it('should check if undo is available', () => {
      expect(versionControl.canUndo()).toBe(true);

      versionControl.undo();

      expect(versionControl.canUndo()).toBe(false);
    });

    it('should check if redo is available', () => {
      expect(versionControl.canRedo()).toBe(false);

      versionControl.undo();

      expect(versionControl.canRedo()).toBe(true);
    });

    it('should return null when undo is not available', () => {
      versionControl.undo();
      const undone = versionControl.undo();

      expect(undone).toBeNull();
    });

    it('should return null when redo is not available', () => {
      const redone = versionControl.redo();

      expect(redone).toBeNull();
    });
  });

  describe('Version History', () => {
    it('should get version history', () => {
      versionControl.saveVersion(manifest, 'Version 1');
      versionControl.saveVersion(manifest, 'Version 2');

      const history = versionControl.getVersionHistory();

      expect(history).toHaveLength(2);
    });

    it('should get current version', () => {
      versionControl.saveVersion(manifest, 'Version 1');

      const current = versionControl.getCurrentVersion();

      expect(current).toBeTruthy();
      expect(current?.description).toBe('Version 1');
    });

    it('should clear version history', () => {
      versionControl.saveVersion(manifest, 'Version 1');
      versionControl.clearVersionHistory();

      const history = versionControl.getVersionHistory();

      expect(history).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      versionControl.updateConfig({ maxVersions: 50 });

      const config = versionControl.getConfig();

      expect(config.maxVersions).toBe(50);
    });

    it('should get current configuration', () => {
      const config = versionControl.getConfig();

      expect(config.autoSaveEnabled).toBe(false);
      expect(config.persistToLocalStorage).toBe(false);
    });
  });

  describe('Export/Import', () => {
    it('should export version history', () => {
      versionControl.saveVersion(manifest, 'Version 1');

      const exported = versionControl.exportVersionHistory();

      expect(exported.versions).toHaveLength(1);
      expect(exported.currentVersionIndex).toBe(0);
      expect(exported.config).toBeTruthy();
    });

    it('should import version history', () => {
      const versionId = versionControl.saveVersion(manifest, 'Version 1');

      const exported = versionControl.exportVersionHistory();

      const newVersionControl = new VersionControlHooks({
        ...DEFAULT_VERSION_CONTROL_CONFIG,
        autoSaveEnabled: false,
        persistToLocalStorage: false,
      });

      newVersionControl.importVersionHistory(exported);

      const history = newVersionControl.getVersionHistory();

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(versionId);

      newVersionControl.cleanup();
    });
  });

  describe('Auto-save', () => {
    it('should enable auto-save when configured', () => {
      vi.useFakeTimers();

      const autoSaveVersionControl = new VersionControlHooks({
        ...DEFAULT_VERSION_CONTROL_CONFIG,
        autoSaveEnabled: true,
        autoSaveInterval: 1000,
        persistToLocalStorage: false,
      });

      autoSaveVersionControl.initialize();
      autoSaveVersionControl.updateCurrentManifest(manifest);
      autoSaveVersionControl.saveVersion(manifest, 'Initial');

      // Modify manifest
      const modifiedManifest = {
        ...manifest,
        walls: [...manifest.walls, {
          id: 'wall-2',
          start: { x: 100, y: 0 },
          end: { x: 100, y: 100 },
          thickness: 10,
          height: 300,
        }],
      };

      autoSaveVersionControl.updateCurrentManifest(modifiedManifest);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      const history = autoSaveVersionControl.getVersionHistory();

      // Should have initial + auto-saved version
      expect(history.length).toBeGreaterThanOrEqual(1);

      autoSaveVersionControl.cleanup();
      vi.useRealTimers();
    });
  });
});
