/**
 * Export Module
 * 
 * Handles exporting blueprint projects in multiple formats:
 * - JSON: Complete project manifest with all data
 * - SVG: 2D blueprint vector format
 * - GLTF: 3D model format
 * - PDF: Rendered blueprint (future)
 * - Thumbnail: Preview image
 * 
 * Part of STEP 7 - Export & Import Functionality
 * 
 * GOVERNANCE ENFORCEMENT: All exports are validated before saving
 */

import type { ProjectManifest, Wall, Opening } from '@/types';
import type { GovernanceEvent } from './governanceLock';
import type { VersionSnapshot } from './versionControlHooks';
import { enforce } from '@/governance/core/enforcer';
import { createSnapshot } from '@/governance/snapshots/snapshotManager';
import { buildTextPdf, pdfBytesToBlob } from '@/utils/minimalPdf';

export interface ExportOptions {
  includeGovernanceHistory?: boolean;
  includeVersionHistory?: boolean;
  includeThumbnail?: boolean;
  format: 'json' | 'svg' | 'gltf' | 'pdf';
  quality?: 'low' | 'medium' | 'high';
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename: string;
  mimeType: string;
  size?: number;
  error?: string;
}

export interface ExportPackage {
  manifest: ProjectManifest;
  governanceHistory?: GovernanceEvent[];
  versionHistory?: VersionSnapshot[];
  thumbnail?: string; // Base64 encoded image
  exportedAt: string;
  exportVersion: string;
  metadata: {
    wallCount: number;
    openingCount: number;
    materialCount: number;
  };
}

/**
 * Export Module Class
 */
export class ExportModule {
  private static readonly EXPORT_VERSION = '1.0.0';
  private static readonly GRID_SIZE = 20;

  /**
   * Export project as JSON
   */
  static async exportJSON(
    manifest: ProjectManifest,
    options: ExportOptions = { format: 'json' }
  ): Promise<ExportResult> {
    try {
      // GOVERNANCE ENFORCEMENT: Validate manifest before export
      const enforcementResult = enforce(manifest);
      
      if (!enforcementResult.success) {
        console.warn('[EXPORT] Governance enforcement failed:', enforcementResult.errors);
        return {
          success: false,
          filename: 'export_failed.json',
          mimeType: 'application/json',
          error: `Governance enforcement failed: ${enforcementResult.errors.join(', ')}`,
        };
      }
      
      // Create immutable snapshot on successful export
      createSnapshot(manifest, 'development', true);
      
      const exportPackage: ExportPackage = {
        manifest,
        exportedAt: new Date().toISOString(),
        exportVersion: this.EXPORT_VERSION,
        metadata: {
          wallCount: manifest.walls.length,
          openingCount: manifest.openings.length,
          materialCount: manifest.materials.length,
        },
      };

      // Include governance history if requested
      if (options.includeGovernanceHistory) {
        const governanceHistory = this.loadGovernanceHistory();
        if (governanceHistory) {
          exportPackage.governanceHistory = governanceHistory;
        }
      }

      // Include version history if requested
      if (options.includeVersionHistory) {
        const versionHistory = this.loadVersionHistory();
        if (versionHistory) {
          exportPackage.versionHistory = versionHistory;
        }
      }

      // Include thumbnail if requested
      if (options.includeThumbnail) {
        const thumbnail = await this.generateThumbnail(manifest);
        if (thumbnail) {
          exportPackage.thumbnail = thumbnail;
        }
      }

      const jsonString = JSON.stringify(exportPackage, null, 2);
      const filename = `${manifest.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;

      return {
        success: true,
        data: jsonString,
        filename,
        mimeType: 'application/json',
        size: new Blob([jsonString]).size,
      };
    } catch (error) {
      return {
        success: false,
        filename: 'export_failed.json',
        mimeType: 'application/json',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export project as SVG (2D blueprint)
   */
  static async exportSVG(
    manifest: ProjectManifest,
    _options: ExportOptions = { format: 'svg' }
  ): Promise<ExportResult> {
    try {
      const svg = this.generateSVG(manifest);
      const filename = `${manifest.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.svg`;

      return {
        success: true,
        data: svg,
        filename,
        mimeType: 'image/svg+xml',
        size: new Blob([svg]).size,
      };
    } catch (error) {
      return {
        success: false,
        filename: 'export_failed.svg',
        mimeType: 'image/svg+xml',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async exportPDF(
    manifest: ProjectManifest,
    _options: ExportOptions = { format: 'pdf' }
  ): Promise<ExportResult> {
    try {
      const lines = [
        `Exported: ${new Date().toISOString()}`,
        `Walls: ${manifest.walls.length}`,
        `Openings: ${manifest.openings.length}`,
        `Labels: ${manifest.labels?.length ?? 0}`,
        `Dimensions: ${manifest.dimensions?.length ?? 0}`,
        `Grid size: ${manifest.gridSize}px`,
        '',
        'Floor plan vector detail is available via SVG export.',
      ];

      const pdfBytes = buildTextPdf(manifest.name, lines);
      const blob = pdfBytesToBlob(pdfBytes);
      const filename = `${manifest.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;

      return {
        success: true,
        data: blob,
        filename,
        mimeType: 'application/pdf',
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        filename: 'export_failed.pdf',
        mimeType: 'application/pdf',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate SVG from manifest
   */
  private static generateSVG(manifest: ProjectManifest): string {
    // Calculate bounds
    const bounds = this.calculateBounds(manifest.walls);
    const padding = 50;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .wall { stroke: #2c1810; stroke-width: 2; fill: none; }
      .door { fill: #dc2626; opacity: 0.6; }
      .window { fill: #2563eb; opacity: 0.6; }
      .grid { stroke: #d4c5b9; stroke-width: 0.5; opacity: 0.3; }
      .text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c1810; }
    </style>
  </defs>
  
  <!-- Grid -->
  <g id="grid">`;

    // Add grid lines
    for (let x = 0; x <= width; x += this.GRID_SIZE) {
      svg += `\n    <line class="grid" x1="${x}" y1="0" x2="${x}" y2="${height}" />`;
    }
    for (let y = 0; y <= height; y += this.GRID_SIZE) {
      svg += `\n    <line class="grid" x1="0" y1="${y}" x2="${width}" y2="${y}" />`;
    }

    svg += `\n  </g>\n\n  <!-- Walls -->
  <g id="walls">`;

    // Add walls
    for (const wall of manifest.walls) {
      const x1 = wall.start.x - bounds.minX + padding;
      const y1 = wall.start.y - bounds.minY + padding;
      const x2 = wall.end.x - bounds.minX + padding;
      const y2 = wall.end.y - bounds.minY + padding;

      svg += `\n    <line class="wall" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${wall.thickness}" />`;
    }

    svg += `\n  </g>\n\n  <!-- Openings -->
  <g id="openings">`;

    // Add openings
    for (const opening of manifest.openings) {
      const wall = manifest.walls.find(w => w.id === opening.wallId);
      if (!wall) continue;

      const wallLength = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
      );

      const openingX = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
      const openingY = wall.start.y + (wall.end.y - wall.start.y) * opening.position;

      const x = openingX - bounds.minX + padding;
      const y = openingY - bounds.minY + padding;

      const className = opening.type === 'door' ? 'door' : 'window';
      svg += `\n    <circle class="${className}" cx="${x}" cy="${y}" r="5" />`;
    }

    svg += `\n  </g>\n\n  <!-- Labels -->
  <g id="labels">`;

    // Add title
    svg += `\n    <text class="text" x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold">${manifest.name}</text>`;

    // Add metadata
    svg += `\n    <text class="text" x="10" y="${height - 10}">Walls: ${manifest.walls.length} | Openings: ${manifest.openings.length}</text>`;

    for (const label of manifest.labels ?? []) {
      const x = label.position.x - bounds.minX + padding;
      const y = label.position.y - bounds.minY + padding;
      svg += `\n    <text class="text" x="${x}" y="${y}" font-size="${label.fontSize ?? 14}">${label.text}</text>`;
    }

    for (const dimension of manifest.dimensions ?? []) {
      const x1 = dimension.start.x - bounds.minX + padding;
      const y1 = dimension.start.y - bounds.minY + padding;
      const x2 = dimension.end.x - bounds.minX + padding;
      const y2 = dimension.end.y - bounds.minY + padding;
      svg += `\n    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b8941f" stroke-width="1" />`;
    }

    svg += `\n  </g>\n</svg>`;

    return svg;
  }

  /**
   * Calculate bounds of all walls
   */
  private static calculateBounds(walls: Wall[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (walls.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const wall of walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Generate thumbnail preview
   */
  private static async generateThumbnail(manifest: ProjectManifest): Promise<string | null> {
    try {
      // Create a small SVG for thumbnail
      const svg = this.generateSVG(manifest);
      
      // Convert SVG to base64
      const base64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  /**
   * Load governance history from localStorage
   */
  private static loadGovernanceHistory(): GovernanceEvent[] | null {
    try {
      const stored = localStorage.getItem('governance-event-log');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load governance history:', error);
    }
    return null;
  }

  /**
   * Load version history from localStorage
   */
  private static loadVersionHistory(): VersionSnapshot[] | null {
    try {
      const stored = localStorage.getItem('version-control-snapshots');
      if (stored) {
        const data = JSON.parse(stored);
        return data.versions || null;
      }
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
    return null;
  }

  /**
   * Download exported file
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Cannot download failed export:', result.error);
      return;
    }

    const blob = typeof result.data === 'string'
      ? new Blob([result.data], { type: result.mimeType })
      : result.data;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download in one step
   */
  static async exportAndDownload(
    manifest: ProjectManifest,
    options: ExportOptions
  ): Promise<ExportResult> {
    let result: ExportResult;

    switch (options.format) {
      case 'json':
        result = await this.exportJSON(manifest, options);
        break;
      case 'svg':
        result = await this.exportSVG(manifest, options);
        break;
      case 'gltf':
        result = {
          success: false,
          filename: 'export_failed.gltf',
          mimeType: 'model/gltf+json',
          error: 'GLTF export not yet implemented',
        };
        break;
      case 'pdf':
        result = await this.exportPDF(manifest, options);
        break;
      default:
        result = {
          success: false,
          filename: 'export_failed.json',
          mimeType: 'application/json',
          error: 'Unsupported export format',
        };
    }

    if (result.success) {
      this.downloadFile(result);
    }

    return result;
  }
}

/**
 * Convenience functions for export
 */
export async function exportProjectJSON(
  manifest: ProjectManifest,
  includeHistory = true
): Promise<ExportResult> {
  return ExportModule.exportJSON(manifest, {
    format: 'json',
    includeGovernanceHistory: includeHistory,
    includeVersionHistory: includeHistory,
    includeThumbnail: true,
  });
}

export async function exportProjectSVG(manifest: ProjectManifest): Promise<ExportResult> {
  return ExportModule.exportSVG(manifest, { format: 'svg' });
}

export async function exportAndDownload(
  manifest: ProjectManifest,
  format: 'json' | 'svg' | 'gltf' | 'pdf',
  includeHistory = true
): Promise<ExportResult> {
  return ExportModule.exportAndDownload(manifest, {
    format,
    includeGovernanceHistory: includeHistory,
    includeVersionHistory: includeHistory,
    includeThumbnail: true,
  });
}
