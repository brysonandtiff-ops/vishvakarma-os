/**
 * Format Validator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormatValidator, validateImportFile, validateImportJSON } from '@/modules/formatValidator';
import type { ProjectManifest } from '@/types';
import type { ExportPackage } from '@/modules/export';

describe('FormatValidator', () => {
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

    validExportPackage = {
      manifest: validManifest,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      metadata: {
        wallCount: 1,
        openingCount: 0,
        materialCount: 0,
      },
    };
  });

  describe('File Validation', () => {
    it('should validate JSON file', () => {
      const content = JSON.stringify(validManifest);
      const file = new File([content], 'test.json', { type: 'application/json' });
      const result = FormatValidator.validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('json');
    });

    it('should validate SVG file', () => {
      const content = '<svg><rect width="100" height="100" /></svg>';
      const file = new File([content], 'test.svg', { type: 'image/svg+xml' });
      const result = FormatValidator.validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('svg');
    });

    it('should reject file that is too large', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'test.json', { type: 'application/json' });
      const result = FormatValidator.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject file that is too small', () => {
      const file = new File(['x'], 'test.json', { type: 'application/json' });
      const result = FormatValidator.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too small'))).toBe(true);
    });

    it('should reject unsupported file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = FormatValidator.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported file type'))).toBe(true);
    });
  });

  describe('JSON Validation', () => {
    it('should validate valid export package', () => {
      const json = JSON.stringify(validExportPackage);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid plain manifest', () => {
      const json = JSON.stringify(validManifest);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON', () => {
      const result = FormatValidator.validateJSON('{ invalid json }');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid JSON'))).toBe(true);
    });

    it('should reject JSON without required fields', () => {
      const json = JSON.stringify({ foo: 'bar' });
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid JSON structure'))).toBe(true);
    });

    it('should detect orphaned openings', () => {
      const manifestWithOrphan = {
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

      const json = JSON.stringify(manifestWithOrphan);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('orphaned'))).toBe(true);
    });

    it('should detect duplicate wall IDs', () => {
      const manifestWithDuplicates = {
        ...validManifest,
        walls: [
          ...validManifest.walls,
          { ...validManifest.walls[0] },
        ],
      };

      const json = JSON.stringify(manifestWithDuplicates);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate wall ID'))).toBe(true);
    });

    it('should warn about metadata mismatch', () => {
      const packageWithMismatch = {
        ...validExportPackage,
        metadata: {
          wallCount: 999,
          openingCount: 0,
          materialCount: 0,
        },
      };

      const json = JSON.stringify(packageWithMismatch);
      const result = FormatValidator.validateJSON(json);

      expect(result.warnings.some(w => w.includes('Wall count mismatch'))).toBe(true);
    });

    it('should validate zero-length walls', () => {
      const manifestWithZeroWall = {
        ...validManifest,
        walls: [
          {
            id: 'wall-1',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
            thickness: 10,
            height: 300,
            material: 'material-paint',
          },
        ],
      };

      const json = JSON.stringify(manifestWithZeroWall);
      const result = FormatValidator.validateJSON(json);

      expect(result.warnings.some(w => w.includes('zero or near-zero length'))).toBe(true);
    });

    it('should reject invalid wall dimensions', () => {
      const manifestWithInvalidWall = {
        ...validManifest,
        walls: [
          {
            id: 'wall-1',
            start: { x: 0, y: 0 },
            end: { x: 100, y: 0 },
            thickness: -10,
            height: 300,
            material: 'material-paint',
          },
        ],
      };

      const json = JSON.stringify(manifestWithInvalidWall);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid thickness'))).toBe(true);
    });

    it('should reject invalid opening position', () => {
      const manifestWithInvalidOpening = {
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

      const json = JSON.stringify(manifestWithInvalidOpening);
      const result = FormatValidator.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid position'))).toBe(true);
    });
  });

  describe('Version Compatibility', () => {
    it('should accept supported version', () => {
      const result = FormatValidator.checkVersionCompatibility('1.0.0');

      expect(result.compatible).toBe(true);
      expect(result.message).toContain('fully supported');
    });

    it('should warn about newer version', () => {
      const result = FormatValidator.checkVersionCompatibility('2.0.0');

      expect(result.compatible).toBe(false);
      expect(result.message).toContain('newer than supported');
    });

    it('should accept older version with warning', () => {
      const result = FormatValidator.checkVersionCompatibility('0.9.0');

      expect(result.compatible).toBe(true);
      expect(result.message).toContain('may be compatible');
    });
  });

  describe('Manifest Sanitization', () => {
    it('should remove orphaned openings', () => {
      const manifestWithOrphan = {
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

      const sanitized = FormatValidator.sanitizeManifest(manifestWithOrphan);

      expect(sanitized.openings).toHaveLength(0);
    });

    it('should clamp opening positions', () => {
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

      const sanitized = FormatValidator.sanitizeManifest(manifestWithInvalidPosition);

      expect(sanitized.openings[0].position).toBe(1);
    });

    it('should ensure positive dimensions', () => {
      const manifestWithNegative = {
        ...validManifest,
        walls: [
          {
            id: 'wall-1',
            start: { x: 0, y: 0 },
            end: { x: 100, y: 0 },
            thickness: -10,
            height: -300,
            material: 'material-paint',
          },
        ],
      };

      const sanitized = FormatValidator.sanitizeManifest(manifestWithNegative);

      expect(sanitized.walls[0].thickness).toBeGreaterThan(0);
      expect(sanitized.walls[0].height).toBeGreaterThan(0);
    });
  });

  describe('Convenience Functions', () => {
    it('should validate file with convenience function', () => {
      const content = JSON.stringify(validManifest);
      const file = new File([content], 'test.json', { type: 'application/json' });
      const result = validateImportFile(file);

      expect(result.valid).toBe(true);
    });

    it('should validate JSON with convenience function', () => {
      const json = JSON.stringify(validManifest);
      const result = validateImportJSON(json);

      expect(result.valid).toBe(true);
    });
  });
});
