/**
 * Format Validator Module
 * 
 * Validates imported file formats and ensures compatibility.
 * Checks version compatibility, data integrity, and schema compliance.
 * 
 * Part of STEP 7 - Export & Import Functionality
 */

import type { ProjectManifest } from '@/types';
import { validateManifest } from '@/core/manifestSchema';
import type { ExportPackage } from './export';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  version?: string;
  compatible: boolean;
}

export interface FileValidationResult extends ValidationResult {
  fileType?: 'json' | 'svg' | 'gltf' | 'unknown';
  fileSize?: number;
}

/**
 * Format Validator Class
 */
export class FormatValidator {
  private static readonly SUPPORTED_VERSIONS = ['1.0.0'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_FILE_SIZE = 10; // 10 bytes

  /**
   * Validate file before import
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
    }

    if (file.size < this.MIN_FILE_SIZE) {
      errors.push('File is too small to be a valid project file');
    }

    // Determine file type
    const fileType = this.detectFileType(file);

    if (fileType === 'unknown') {
      errors.push('Unsupported file type. Expected .json, .svg, or .gltf file');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      compatible: errors.length === 0,
      fileType,
      fileSize: file.size,
    };
  }

  /**
   * Detect file type from file
   */
  private static detectFileType(file: File): 'json' | 'svg' | 'gltf' | 'unknown' {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'json':
        return 'json';
      case 'svg':
        return 'svg';
      case 'gltf':
      case 'glb':
        return 'gltf';
      default:
        // Check MIME type
        if (file.type === 'application/json') return 'json';
        if (file.type === 'image/svg+xml') return 'svg';
        if (file.type === 'model/gltf+json') return 'gltf';
        return 'unknown';
    }
  }

  /**
   * Validate JSON content
   */
  static validateJSON(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const data = JSON.parse(content);

      // Check if it's an export package
      if (this.isExportPackage(data)) {
        return this.validateExportPackage(data);
      }

      // Check if it's a plain manifest
      if (this.isManifest(data)) {
        return this.validatePlainManifest(data);
      }

      errors.push('Invalid JSON structure. Expected ExportPackage or ProjectManifest');
    } catch (error) {
      errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
    }

    return {
      valid: false,
      errors,
      warnings,
      compatible: false,
    };
  }

  /**
   * Check if data is an export package
   */
  private static isExportPackage(data: unknown): data is ExportPackage {
    if (typeof data !== 'object' || data === null) return false;
    const pkg = data as Record<string, unknown>;
    return 'manifest' in pkg && 'exportVersion' in pkg && 'exportedAt' in pkg;
  }

  /**
   * Check if data is a manifest
   */
  private static isManifest(data: unknown): data is ProjectManifest {
    if (typeof data !== 'object' || data === null) return false;
    const manifest = data as Record<string, unknown>;
    return 'version' in manifest && 'walls' in manifest && 'openings' in manifest;
  }

  /**
   * Validate export package
   */
  private static validateExportPackage(pkg: ExportPackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check export version
    if (!pkg.exportVersion) {
      errors.push('Missing export version');
    } else if (!this.SUPPORTED_VERSIONS.includes(pkg.exportVersion)) {
      warnings.push(
        `Export version ${pkg.exportVersion} may not be fully compatible. Supported versions: ${this.SUPPORTED_VERSIONS.join(', ')}`
      );
    }

    // Check exported date
    if (!pkg.exportedAt) {
      warnings.push('Missing export timestamp');
    } else {
      const exportDate = new Date(pkg.exportedAt);
      if (Number.isNaN(exportDate.getTime())) {
        warnings.push('Invalid export timestamp');
      }
    }

    // Validate manifest
    const manifestValidation = this.validatePlainManifest(pkg.manifest);
    errors.push(...manifestValidation.errors);
    warnings.push(...manifestValidation.warnings);

    // Check metadata consistency
    if (pkg.metadata) {
      if (pkg.metadata.wallCount !== pkg.manifest.walls.length) {
        warnings.push(
          `Wall count mismatch: metadata says ${pkg.metadata.wallCount}, but found ${pkg.manifest.walls.length}`
        );
      }

      if (pkg.metadata.openingCount !== pkg.manifest.openings.length) {
        warnings.push(
          `Opening count mismatch: metadata says ${pkg.metadata.openingCount}, but found ${pkg.manifest.openings.length}`
        );
      }
    }

    // Validate governance history if present
    if (pkg.governanceHistory) {
      if (!Array.isArray(pkg.governanceHistory)) {
        errors.push('Governance history must be an array');
      } else {
        for (let i = 0; i < pkg.governanceHistory.length; i++) {
          const event = pkg.governanceHistory[i];
          if (!event.type || !event.timestamp) {
            errors.push(`Invalid governance event at index ${i}: missing type or timestamp`);
          }
        }
      }
    }

    // Validate version history if present
    if (pkg.versionHistory) {
      if (!Array.isArray(pkg.versionHistory)) {
        errors.push('Version history must be an array');
      } else {
        for (let i = 0; i < pkg.versionHistory.length; i++) {
          const snapshot = pkg.versionHistory[i];
          if (!snapshot.id || !snapshot.timestamp || !snapshot.manifest) {
            errors.push(`Invalid version snapshot at index ${i}: missing required fields`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      version: pkg.exportVersion,
      compatible: errors.length === 0,
    };
  }

  /**
   * Validate plain manifest
   */
  private static validatePlainManifest(manifest: ProjectManifest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!manifest.version) {
      errors.push('Missing manifest version');
    }

    if (!manifest.name) {
      errors.push('Missing project name');
    }

    if (!Array.isArray(manifest.walls)) {
      errors.push('Walls must be an array');
    }

    if (!Array.isArray(manifest.openings)) {
      errors.push('Openings must be an array');
    }

    if (!Array.isArray(manifest.materials)) {
      errors.push('Materials must be an array');
    }

    // Validate using schema validator
    try {
      validateManifest(manifest);
    } catch (error) {
      errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for orphaned openings
    const wallIds = new Set(manifest.walls.map(w => w.id));
    const orphanedOpenings = manifest.openings.filter(o => !wallIds.has(o.wallId));

    if (orphanedOpenings.length > 0) {
      errors.push(`Found ${orphanedOpenings.length} orphaned openings without walls`);
    }

    // Check for duplicate IDs
    const wallIdSet = new Set<string>();
    for (const wall of manifest.walls) {
      if (wallIdSet.has(wall.id)) {
        errors.push(`Duplicate wall ID: ${wall.id}`);
      }
      wallIdSet.add(wall.id);
    }

    const openingIdSet = new Set<string>();
    for (const opening of manifest.openings) {
      if (openingIdSet.has(opening.id)) {
        errors.push(`Duplicate opening ID: ${opening.id}`);
      }
      openingIdSet.add(opening.id);
    }

    // Check wall validity
    for (const wall of manifest.walls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 1) {
        warnings.push(`Wall ${wall.id} has zero or near-zero length`);
      }

      if (wall.thickness <= 0) {
        errors.push(`Wall ${wall.id} has invalid thickness: ${wall.thickness}`);
      }

      if (wall.height <= 0) {
        errors.push(`Wall ${wall.id} has invalid height: ${wall.height}`);
      }
    }

    // Check opening validity
    for (const opening of manifest.openings) {
      if (opening.position < 0 || opening.position > 1) {
        errors.push(`Opening ${opening.id} has invalid position: ${opening.position} (must be 0-1)`);
      }

      if (opening.width <= 0) {
        errors.push(`Opening ${opening.id} has invalid width: ${opening.width}`);
      }

      if (opening.height <= 0) {
        errors.push(`Opening ${opening.id} has invalid height: ${opening.height}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      version: manifest.version,
      compatible: errors.length === 0,
    };
  }

  /**
   * Check version compatibility
   */
  static checkVersionCompatibility(version: string): {
    compatible: boolean;
    message: string;
  } {
    if (this.SUPPORTED_VERSIONS.includes(version)) {
      return {
        compatible: true,
        message: `Version ${version} is fully supported`,
      };
    }

    // Check if version is newer
    const [major, minor, patch] = version.split('.').map(Number);
    const [supportedMajor] = this.SUPPORTED_VERSIONS[0].split('.').map(Number);

    if (major > supportedMajor) {
      return {
        compatible: false,
        message: `Version ${version} is newer than supported versions. Import may fail or produce unexpected results.`,
      };
    }

    return {
      compatible: true,
      message: `Version ${version} may be compatible, but full support is not guaranteed.`,
    };
  }

  /**
   * Sanitize imported data
   */
  static sanitizeManifest(manifest: ProjectManifest): ProjectManifest {
    // Create a deep clone
    const sanitized = JSON.parse(JSON.stringify(manifest)) as ProjectManifest;

    // Remove orphaned openings
    const wallIds = new Set(sanitized.walls.map(w => w.id));
    sanitized.openings = sanitized.openings.filter(o => wallIds.has(o.wallId));

    // Clamp opening positions
    for (const opening of sanitized.openings) {
      opening.position = Math.max(0, Math.min(1, opening.position));
    }

    // Ensure positive dimensions
    for (const wall of sanitized.walls) {
      wall.thickness = Math.max(1, wall.thickness);
      wall.height = Math.max(1, wall.height);
    }

    for (const opening of sanitized.openings) {
      opening.width = Math.max(1, opening.width);
      opening.height = Math.max(1, opening.height);
      if (opening.sillHeight !== undefined) {
        opening.sillHeight = Math.max(0, opening.sillHeight);
      }
    }

    return sanitized;
  }
}

/**
 * Convenience functions
 */
export function validateImportFile(file: File): FileValidationResult {
  return FormatValidator.validateFile(file);
}

export function validateImportJSON(content: string): ValidationResult {
  return FormatValidator.validateJSON(content);
}

export function checkCompatibility(version: string): { compatible: boolean; message: string } {
  return FormatValidator.checkVersionCompatibility(version);
}

export function sanitizeImportedManifest(manifest: ProjectManifest): ProjectManifest {
  return FormatValidator.sanitizeManifest(manifest);
}
