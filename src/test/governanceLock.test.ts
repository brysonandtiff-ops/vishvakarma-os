/**
 * Governance Lock Tests
 * 
 * Tests for the Governance Lock module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GovernanceLock, DEFAULT_GOVERNANCE_CONFIG } from '@/modules/governanceLock';
import type { ProjectManifest } from '@/types';

describe('GovernanceLock', () => {
  let governance: GovernanceLock;
  let validManifest: ProjectManifest;

  beforeEach(() => {
    governance = new GovernanceLock(DEFAULT_GOVERNANCE_CONFIG);

    validManifest = {
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

  describe('Event Logging', () => {
    it('should log events', () => {
      governance.logEvent({
        type: 'test-event',
        timestamp: Date.now(),
      });

      const log = governance.getEventLog();

      expect(log).toHaveLength(1);
      expect(log[0].type).toBe('test-event');
    });

    it('should clear event log', () => {
      governance.logEvent({
        type: 'test-event',
        timestamp: Date.now(),
      });

      governance.clearEventLog();

      const log = governance.getEventLog();

      expect(log).toHaveLength(0);
    });
  });

  describe('Manifest Validation', () => {
    it('should validate a valid manifest', () => {
      const result = governance.validateManifest(validManifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest without version', () => {
      const invalidManifest = { ...validManifest, version: '' };

      const result = governance.validateManifest(invalidManifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
    });

    it('should reject manifest without name', () => {
      const invalidManifest = { ...validManifest, name: '' };

      const result = governance.validateManifest(invalidManifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should detect orphaned openings', () => {
      const manifestWithOrphanedOpening = {
        ...validManifest,
        openings: [
          {
            id: 'opening-1',
            wallId: 'wall-999',
            type: 'door' as const,
            position: 0.5,
            width: 90,
            height: 210,
          },
        ],
      };

      const result = governance.validateManifest(manifestWithOrphanedOpening);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('orphaned'))).toBe(true);
    });

    it('should detect duplicate wall IDs', () => {
      const manifestWithDuplicates = {
        ...validManifest,
        walls: [
          ...validManifest.walls,
          { ...validManifest.walls[0] }, // Duplicate
        ],
      };

      const result = governance.validateManifest(manifestWithDuplicates);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate wall ID'))).toBe(true);
    });
  });

  describe('Drift Detection', () => {
    it('should detect no drift when no previous state', () => {
      const result = governance.checkForDrift(validManifest);

      expect(result.hasDrift).toBe(false);
      expect(result.driftDetails).toHaveLength(0);
    });

    it('should detect wall count change', () => {
      governance.approveManifest(validManifest);

      const modifiedManifest = {
        ...validManifest,
        walls: [
          ...validManifest.walls,
          {
            id: 'wall-2',
            start: { x: 100, y: 0 },
            end: { x: 100, y: 100 },
            thickness: 10,
            height: 300,
          },
        ],
      };

      const result = governance.checkForDrift(modifiedManifest);

      expect(result.hasDrift).toBe(true);
      expect(result.driftDetails.some(d => d.includes('Wall count'))).toBe(true);
    });

    it('should detect opening count change', () => {
      governance.approveManifest(validManifest);

      const modifiedManifest = {
        ...validManifest,
        openings: [
          {
            id: 'opening-1',
            wallId: 'wall-1',
            type: 'door' as const,
            position: 0.5,
            width: 90,
            height: 210,
          },
        ],
      };

      const result = governance.checkForDrift(modifiedManifest);

      expect(result.hasDrift).toBe(true);
      expect(result.driftDetails.some(d => d.includes('Opening count'))).toBe(true);
    });
  });

  describe('Manifest Approval', () => {
    it('should approve valid manifest', () => {
      const result = governance.approveManifest(validManifest);

      expect(result).toBe(true);
      expect(governance.getLastValidatedState()).toEqual(validManifest);
    });

    it('should reject invalid manifest', () => {
      const invalidManifest = { ...validManifest, version: '' };

      const result = governance.approveManifest(invalidManifest);

      expect(result).toBe(false);
      expect(governance.getLastValidatedState()).toBeNull();
    });
  });

  describe('Lock/Unlock', () => {
    it('should lock and unlock governance', () => {
      expect(governance.isLocked()).toBe(false);

      governance.lock();
      expect(governance.isLocked()).toBe(true);

      governance.unlock();
      expect(governance.isLocked()).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      governance.updateConfig({ enforceValidation: false });

      const config = governance.getConfig();

      expect(config.enforceValidation).toBe(false);
    });

    it('should get current configuration', () => {
      const config = governance.getConfig();

      expect(config).toEqual(DEFAULT_GOVERNANCE_CONFIG);
    });
  });

  describe('Report Export', () => {
    it('should export governance report', () => {
      governance.logEvent({
        type: 'test-event',
        timestamp: Date.now(),
      });

      governance.approveManifest(validManifest);

      const report = governance.exportReport();

      expect(report.config).toEqual(DEFAULT_GOVERNANCE_CONFIG);
      expect(report.eventLog.length).toBeGreaterThan(0);
      expect(report.lastValidatedState).toEqual(validManifest);
      expect(report.locked).toBe(false);
    });
  });
});
