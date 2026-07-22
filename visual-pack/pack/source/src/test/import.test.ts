/**
 * Import Module Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportModule, importProjectJSON } from '@/modules/import';
import type { ProjectManifest } from '@/types';
import type { ExportPackage } from '@/modules/export';

describe('ImportModule', () => {
  let validManifest: ProjectManifest;
  let validExportPackage: ExportPackage;

  beforeEach(() => {
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
      openings: [
        {
          id: 'opening-1',
          wallId: 'wall-1',
          type: 'door',
          position: 0.5,
          width: 90,
          height: 210,
        },
      ],
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

    validExportPackage = {
      manifest: validManifest,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      metadata: {
        wallCount: 1,
        openingCount: 1,
        materialCount: 0,
      },
    };

    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('JSON Import', () => {
    it('should import valid export package', async () => {
      const json = JSON.stringify(validExportPackage);
      const result = await ImportModule.importJSON(json);

      expect(result.success).toBe(true);
      expect(result.manifest).toBeTruthy();
      expect(result.manifest?.name).toBe('Test Project');
      expect(result.manifest?.walls).toHaveLength(1);
      expect(result.manifest?.openings).toHaveLength(1);
    });

    it('should import valid plain manifest', async () => {
      const json = JSON.stringify(validManifest);
      const result = await ImportModule.importJSON(json);

      expect(result.success).toBe(true);
      expect(result.manifest).toBeTruthy();
      expect(result.manifest?.name).toBe('Test Project');
    });

    it('should include metadata in result', async () => {
      const json = JSON.stringify(validExportPackage);
      const result = await ImportModule.importJSON(json);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeTruthy();
      expect(result.metadata?.wallCount).toBe(1);
      expect(result.metadata?.openingCount).toBe(1);
      expect(result.metadata?.importedAt).toBeTruthy();
    });

    it('should reject invalid JSON', async () => {
      const result = await ImportModule.importJSON('{ invalid json }');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject JSON without required fields', async () => {
      const json = JSON.stringify({ foo: 'bar' });
      const result = await ImportModule.importJSON(json);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize manifest by default', async () => {
      const manifestWithOrphan = {
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
          {
            id: 'opening-2',
            wallId: 'wall-999',
            type: 'door' as const,
            position: 0.5,
            width: 90,
            height: 210,
          },
        ],
      };

      const json = JSON.stringify(manifestWithOrphan);
      const result = await ImportModule.importJSON(json, { sanitize: true });

      expect(result.success).toBe(true);
      // Should keep opening-1 (valid) and remove opening-2 (orphaned)
      expect(result.manifest?.openings).toHaveLength(1);
      expect(result.manifest?.openings[0].id).toBe('opening-1');
    });

    it('should clamp invalid opening positions', async () => {
      const manifestWithInvalidPosition = {
        ...validManifest,
        openings: [
          {
            id: 'opening-1',
            wallId: 'wall-1',
            type: 'door' as const,
            position: 1.5,
            width: 90,
            height: 210,
          },
        ],
      };

      const json = JSON.stringify(manifestWithInvalidPosition);
      const result = await ImportModule.importJSON(json, { sanitize: true });

      expect(result.success).toBe(true);
      expect(result.manifest?.openings[0].position).toBe(1); // Clamped to 1
    });
  });

  describe('History Restoration', () => {
    it('should restore governance history when requested', async () => {
      const packageWithHistory: ExportPackage = {
        ...validExportPackage,
        governanceHistory: [
          {
            type: 'test-event',
            timestamp: Date.now(),
          },
        ],
      };

      const json = JSON.stringify(packageWithHistory);
      const result = await ImportModule.importJSON(json, {
        restoreGovernanceHistory: true,
      });

      expect(result.success).toBe(true);
      expect(result.governanceHistory).toBeTruthy();
      expect(result.governanceHistory).toHaveLength(1);

      // Check localStorage
      const stored = localStorage.getItem('governance-event-log');
      expect(stored).toBeTruthy();
    });

    it('should restore version history when requested', async () => {
      const packageWithVersions: ExportPackage = {
        ...validExportPackage,
        versionHistory: [
          {
            id: 'v-1',
            manifest: validManifest,
            timestamp: Date.now(),
            autoSaved: false,
          },
        ],
      };

      const json = JSON.stringify(packageWithVersions);
      const result = await ImportModule.importJSON(json, {
        restoreVersionHistory: true,
      });

      expect(result.success).toBe(true);
      expect(result.versionHistory).toBeTruthy();
      expect(result.versionHistory).toHaveLength(1);

      // Check localStorage
      const stored = localStorage.getItem('version-control-snapshots');
      expect(stored).toBeTruthy();
    });

    it('should not restore history by default', async () => {
      const packageWithHistory: ExportPackage = {
        ...validExportPackage,
        governanceHistory: [
          {
            type: 'test-event',
            timestamp: Date.now(),
          },
        ],
      };

      const json = JSON.stringify(packageWithHistory);
      const result = await ImportModule.importJSON(json);

      expect(result.success).toBe(true);
      expect(result.governanceHistory).toBeUndefined();
    });
  });

  describe('File Import', () => {
    it('should import from JSON file', async () => {
      const json = JSON.stringify(validExportPackage);
      const file = new File([json], 'test.json', { type: 'application/json' });

      const result = await ImportModule.importFromFile(file);

      expect(result.success).toBe(true);
      expect(result.manifest).toBeTruthy();
    });

    it('should reject file that is too large', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'test.json', { type: 'application/json' });

      const result = await ImportModule.importFromFile(file);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject unsupported file type', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = await ImportModule.importFromFile(file);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported file type'))).toBe(true);
    });
  });

  describe('Round-Trip Test', () => {
    it('should successfully round-trip export and import', async () => {
      // This would be tested with the actual export module
      const json = JSON.stringify(validExportPackage);

      // Export (simulated)
      const exportedData = json;

      // Import
      const result = await ImportModule.importJSON(exportedData);

      expect(result.success).toBe(true);
      expect(result.manifest).toEqual(validManifest);
    });
  });

  describe('Convenience Functions', () => {
    it('should import JSON with convenience function', async () => {
      const json = JSON.stringify(validManifest);
      const result = await importProjectJSON(json);

      expect(result.success).toBe(true);
      expect(result.manifest).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should import SVG wall geometry exported by Vishvakarma.OS', () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <line class="wall" x1="0" y1="0" x2="100" y2="0" stroke-width="10" />
  <circle class="door" cx="50" cy="0" r="5" />
  <text class="text">Imported SVG</text>
</svg>`;

      const result = ImportModule.importFromSVG(svg);

      expect(result.success).toBe(true);
      expect(result.manifest?.walls).toHaveLength(1);
      expect(result.manifest?.openings).toHaveLength(1);
    });

    it('should reject SVG without wall geometry', () => {
      const result = ImportModule.importFromSVG('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('no wall geometry');
    });

    it('should handle corrupted JSON gracefully', async () => {
      const result = await ImportModule.importJSON('{ "version": "1.0.0", "walls": [}');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide clear error messages', async () => {
      const result = await ImportModule.importJSON('{}');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBeTruthy();
    });
  });
});
