/**
 * Export Module Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportModule, exportProjectJSON, exportProjectSVG } from '@/modules/export';
import { initializeGovernanceLock } from '@/modules/governanceLock';
import type { ProjectManifest } from '@/types';

describe('ExportModule', () => {
  let manifest: ProjectManifest;

  beforeEach(() => {
    // Initialize governance lock for export validation
    initializeGovernanceLock({
      enforceValidation: true,
      preventDrift: true,
      logAllOperations: true,
      requireApproval: false,
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
        {
          id: 'wall-2',
          start: { x: 100, y: 0 },
          end: { x: 100, y: 100 },
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
  });

  describe('JSON Export', () => {
    it('should export project as JSON', async () => {
      const result = await ExportModule.exportJSON(manifest, { format: 'json' });

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('Test_Project');
      expect(result.filename).toContain('.json');
    });

    it('should include manifest in export', async () => {
      const result = await ExportModule.exportJSON(manifest, { format: 'json' });

      expect(result.success).toBe(true);

      const exportPackage = JSON.parse(result.data as string);

      expect(exportPackage.manifest).toBeTruthy();
      expect(exportPackage.manifest.name).toBe('Test Project');
      expect(exportPackage.manifest.walls).toHaveLength(2);
      expect(exportPackage.manifest.openings).toHaveLength(1);
    });

    it('should include metadata in export', async () => {
      const result = await ExportModule.exportJSON(manifest, { format: 'json' });

      expect(result.success).toBe(true);

      const exportPackage = JSON.parse(result.data as string);

      expect(exportPackage.metadata).toBeTruthy();
      expect(exportPackage.metadata.wallCount).toBe(2);
      expect(exportPackage.metadata.openingCount).toBe(1);
    });

    it('should include export version and timestamp', async () => {
      const result = await ExportModule.exportJSON(manifest, { format: 'json' });

      expect(result.success).toBe(true);

      const exportPackage = JSON.parse(result.data as string);

      expect(exportPackage.exportVersion).toBe('1.0.0');
      expect(exportPackage.exportedAt).toBeTruthy();
    });

    it('should calculate file size', async () => {
      const result = await ExportModule.exportJSON(manifest, { format: 'json' });

      expect(result.success).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('SVG Export', () => {
    it('should export project as SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.mimeType).toBe('image/svg+xml');
      expect(result.filename).toContain('Test_Project');
      expect(result.filename).toContain('.svg');
    });

    it('should generate valid SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);

      const svg = result.data as string;

      expect(svg).toContain('<?xml version="1.0"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should include walls in SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);

      const svg = result.data as string;

      expect(svg).toContain('id="walls"');
      expect(svg).toContain('class="wall"');
    });

    it('should include openings in SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);

      const svg = result.data as string;

      expect(svg).toContain('id="openings"');
      expect(svg).toContain('class="door"');
    });

    it('should include grid in SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);

      const svg = result.data as string;

      expect(svg).toContain('id="grid"');
      expect(svg).toContain('class="grid"');
    });

    it('should include project name in SVG', async () => {
      const result = await ExportModule.exportSVG(manifest, { format: 'svg' });

      expect(result.success).toBe(true);

      const svg = result.data as string;

      expect(svg).toContain('Test Project');
    });
  });

  describe('Convenience Functions', () => {
    it('should export JSON with convenience function', async () => {
      const result = await exportProjectJSON(manifest);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
    });

    it('should export SVG with convenience function', async () => {
      const result = await exportProjectSVG(manifest);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('image/svg+xml');
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported format', async () => {
      const result = await ExportModule.exportAndDownload(manifest, {
        format: 'gltf',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not yet implemented');
    });
  });
});
