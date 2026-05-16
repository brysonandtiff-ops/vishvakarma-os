/**
 * Import Module
 * 
 * Handles importing blueprint projects from various formats.
 * Validates format, restores all elements, and maintains history.
 * 
 * Part of STEP 7 - Export & Import Functionality
 */

import type { ProjectManifest } from '@/types';
import type { ExportPackage } from './export';
import type { GovernanceEvent } from './governanceLock';
import type { VersionSnapshot } from './versionControlHooks';
import { FormatValidator } from './formatValidator';
import { logGovernanceEvent } from './governanceLock';

export interface ImportOptions {
  restoreGovernanceHistory?: boolean;
  restoreVersionHistory?: boolean;
  sanitize?: boolean;
  mergeWithExisting?: boolean;
}

export interface ImportResult {
  success: boolean;
  manifest?: ProjectManifest;
  governanceHistory?: GovernanceEvent[];
  versionHistory?: VersionSnapshot[];
  errors: string[];
  warnings: string[];
  metadata?: {
    wallCount: number;
    openingCount: number;
    materialCount: number;
    importedAt: string;
  };
}

/**
 * Import Module Class
 */
export class ImportModule {
  /**
   * Import from file
   */
  static async importFromFile(
    file: File,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // Validate file
    const fileValidation = FormatValidator.validateFile(file);

    if (!fileValidation.valid) {
      return {
        success: false,
        errors: fileValidation.errors,
        warnings: fileValidation.warnings,
      };
    }

    // Read file content
    try {
      const content = await this.readFileContent(file);

      // Import based on file type
      switch (fileValidation.fileType) {
        case 'json':
          return this.importFromJSON(content, options);
        case 'svg':
          return {
            success: false,
            errors: ['SVG import not yet implemented'],
            warnings: [],
          };
        case 'gltf':
          return {
            success: false,
            errors: ['GLTF import not yet implemented'],
            warnings: [],
          };
        default:
          return {
            success: false,
            errors: ['Unsupported file type'],
            warnings: [],
          };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Read file content as text
   */
  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };

      reader.onerror = () => {
        reject(new Error('File reading error'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Import from JSON content
   */
  static importFromJSON(
    content: string,
    options: ImportOptions = {}
  ): ImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate JSON
    const validation = FormatValidator.validateJSON(content);

    // If validation fails and sanitization is disabled, return error
    if (!validation.valid && options.sanitize === false) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // If validation fails but sanitization is enabled, collect warnings
    if (!validation.valid && options.sanitize !== false) {
      warnings.push(...validation.errors.map(e => `Sanitized: ${e}`));
    } else {
      warnings.push(...validation.warnings);
    }

    try {
      const data = JSON.parse(content);

      // Check if it's an export package
      if (this.isExportPackage(data)) {
        return this.importExportPackage(data, options, warnings);
      }

      // Check if it's a plain manifest
      if (this.isManifest(data)) {
        return this.importPlainManifest(data, options, warnings);
      }

      return {
        success: false,
        errors: ['Invalid JSON structure'],
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
      };
    }
  }

  /**
   * Check if data is an export package
   */
  private static isExportPackage(data: unknown): data is ExportPackage {
    if (typeof data !== 'object' || data === null) return false;
    const pkg = data as Record<string, unknown>;
    return 'manifest' in pkg && 'exportVersion' in pkg;
  }

  /**
   * Check if data is a manifest
   */
  private static isManifest(data: unknown): data is ProjectManifest {
    if (typeof data !== 'object' || data === null) return false;
    const manifest = data as Record<string, unknown>;
    return 'version' in manifest && 'walls' in manifest;
  }

  /**
   * Import export package
   */
  private static importExportPackage(
    pkg: ExportPackage,
    options: ImportOptions,
    warnings: string[]
  ): ImportResult {
    const errors: string[] = [];

    // Check version compatibility
    const compatibility = FormatValidator.checkVersionCompatibility(pkg.exportVersion);
    if (!compatibility.compatible) {
      warnings.push(compatibility.message);
    }

    // Sanitize manifest if requested
    let manifest = pkg.manifest;
    if (options.sanitize !== false) {
      manifest = FormatValidator.sanitizeManifest(manifest);
    }

    // Restore governance history if requested
    let governanceHistory: GovernanceEvent[] | undefined;
    if (options.restoreGovernanceHistory && pkg.governanceHistory) {
      governanceHistory = pkg.governanceHistory;
      this.restoreGovernanceHistory(governanceHistory);
    }

    // Restore version history if requested
    let versionHistory: VersionSnapshot[] | undefined;
    if (options.restoreVersionHistory && pkg.versionHistory) {
      versionHistory = pkg.versionHistory;
      this.restoreVersionHistory(versionHistory);
    }

    // Log import event
    logGovernanceEvent({
      type: 'project-imported',
      metadata: {
        source: 'export-package',
        version: pkg.exportVersion,
        wallCount: manifest.walls.length,
        openingCount: manifest.openings.length,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      manifest,
      governanceHistory,
      versionHistory,
      errors,
      warnings,
      metadata: {
        wallCount: manifest.walls.length,
        openingCount: manifest.openings.length,
        materialCount: manifest.materials.length,
        importedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Import plain manifest
   */
  private static importPlainManifest(
    manifest: ProjectManifest,
    options: ImportOptions,
    warnings: string[]
  ): ImportResult {
    const errors: string[] = [];

    // Sanitize manifest if requested
    if (options.sanitize !== false) {
      manifest = FormatValidator.sanitizeManifest(manifest);
    }

    // Log import event
    logGovernanceEvent({
      type: 'project-imported',
      metadata: {
        source: 'plain-manifest',
        version: manifest.version,
        wallCount: manifest.walls.length,
        openingCount: manifest.openings.length,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      manifest,
      errors,
      warnings,
      metadata: {
        wallCount: manifest.walls.length,
        openingCount: manifest.openings.length,
        materialCount: manifest.materials.length,
        importedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Restore governance history to localStorage
   */
  private static restoreGovernanceHistory(history: GovernanceEvent[]): void {
    try {
      // Get existing history
      const existingStr = localStorage.getItem('governance-event-log');
      const existing = existingStr ? JSON.parse(existingStr) : [];

      // Merge histories (avoid duplicates by timestamp)
      const merged = [...existing];
      const existingTimestamps = new Set(existing.map((e: GovernanceEvent) => e.timestamp));

      for (const event of history) {
        if (!existingTimestamps.has(event.timestamp)) {
          merged.push(event);
        }
      }

      // Sort by timestamp
      merged.sort((a, b) => a.timestamp - b.timestamp);

      // Keep last 100 events
      const trimmed = merged.slice(-100);

      localStorage.setItem('governance-event-log', JSON.stringify(trimmed));

      logGovernanceEvent({
        type: 'governance-history-restored',
        metadata: { eventCount: history.length },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to restore governance history:', error);
    }
  }

  /**
   * Restore version history to localStorage
   */
  private static restoreVersionHistory(history: VersionSnapshot[]): void {
    try {
      // Get existing history
      const existingStr = localStorage.getItem('version-control-snapshots');
      const existing = existingStr ? JSON.parse(existingStr) : { versions: [], currentVersionIndex: -1 };

      // Merge histories (avoid duplicates by ID)
      const merged = [...existing.versions];
      const existingIds = new Set(existing.versions.map((v: VersionSnapshot) => v.id));

      for (const snapshot of history) {
        if (!existingIds.has(snapshot.id)) {
          merged.push(snapshot);
        }
      }

      // Sort by timestamp
      merged.sort((a, b) => a.timestamp - b.timestamp);

      // Keep last 100 versions
      const trimmed = merged.slice(-100);

      localStorage.setItem('version-control-snapshots', JSON.stringify({
        versions: trimmed,
        currentVersionIndex: trimmed.length - 1,
      }));

      logGovernanceEvent({
        type: 'version-history-restored',
        metadata: { versionCount: history.length },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to restore version history:', error);
    }
  }

  /**
   * Import from JSON string (convenience method)
   */
  static async importJSON(
    jsonString: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    return this.importFromJSON(jsonString, options);
  }

  /**
   * Import and apply to current project
   */
  static async importAndApply(
    file: File,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const result = await this.importFromFile(file, {
      ...options,
      sanitize: true,
      restoreGovernanceHistory: true,
      restoreVersionHistory: true,
    });

    if (result.success) {
      logGovernanceEvent({
        type: 'project-import-applied',
        metadata: {
          wallCount: result.manifest?.walls.length,
          openingCount: result.manifest?.openings.length,
        },
        timestamp: Date.now(),
      });
    }

    return result;
  }
}

/**
 * Convenience functions
 */
export async function importProject(file: File): Promise<ImportResult> {
  return ImportModule.importFromFile(file, {
    sanitize: true,
    restoreGovernanceHistory: true,
    restoreVersionHistory: true,
  });
}

export async function importProjectJSON(jsonString: string): Promise<ImportResult> {
  return ImportModule.importJSON(jsonString, {
    sanitize: true,
    restoreGovernanceHistory: true,
    restoreVersionHistory: true,
  });
}

export async function importAndApply(file: File): Promise<ImportResult> {
  return ImportModule.importAndApply(file);
}
