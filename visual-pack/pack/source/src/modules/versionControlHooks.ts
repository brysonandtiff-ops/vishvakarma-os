/**
 * Version Control Hooks Module
 * 
 * Provides persistent versioning across sessions with auto-save and restore.
 * Extends undo/redo beyond current session and maintains version history.
 * 
 * Part of STEP 6 - Final Canvas & Governance Lock
 */

import type { ProjectManifest } from '@/types';
import { logGovernanceEvent } from './governanceLock';

export interface VersionSnapshot {
  id: string;
  manifest: ProjectManifest;
  timestamp: number;
  description?: string;
  autoSaved: boolean;
}

export interface VersionControlConfig {
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  maxVersions: number;
  persistToLocalStorage: boolean;
}

/**
 * Version Control Hooks Class
 * Manages version history with auto-save and restore capabilities
 */
export class VersionControlHooks {
  private config: VersionControlConfig;
  private versions: VersionSnapshot[] = [];
  private currentVersionIndex = -1;
  private autoSaveTimer: number | null = null;
  private lastSavedManifest: ProjectManifest | null = null;

  constructor(config: VersionControlConfig) {
    this.config = config;
  }

  /**
   * Initialize version control and load saved versions
   */
  initialize(): void {
    if (this.config.persistToLocalStorage) {
      this.loadVersionsFromStorage();
    }

    if (this.config.autoSaveEnabled) {
      this.startAutoSave();
    }

    logGovernanceEvent({
      type: 'version-control-initialized',
      timestamp: Date.now(),
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.autoSave();
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Auto-save current state if it has changed
   */
  private autoSave(): void {
    if (!this.lastSavedManifest) {
      return;
    }

    // Check if state has changed
    const hasChanged = this.hasManifestChanged(this.lastSavedManifest);

    if (hasChanged) {
      this.saveVersion(this.lastSavedManifest, 'Auto-save', true);
    }
  }

  /**
   * Check if manifest has changed since last save
   */
  private hasManifestChanged(manifest: ProjectManifest): boolean {
    if (this.versions.length === 0) {
      return true;
    }

    const lastVersion = this.versions[this.versions.length - 1];
    
    // Simple comparison - in production, use deep equality check
    return (
      manifest.walls.length !== lastVersion.manifest.walls.length ||
      manifest.openings.length !== lastVersion.manifest.openings.length
    );
  }

  /**
   * Save a version snapshot
   */
  saveVersion(manifest: ProjectManifest, description?: string, autoSaved = false): string {
    const versionId = `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const snapshot: VersionSnapshot = {
      id: versionId,
      manifest: JSON.parse(JSON.stringify(manifest)), // Deep clone
      timestamp: Date.now(),
      description,
      autoSaved,
    };

    // Remove versions after current index (if we're not at the end)
    if (this.currentVersionIndex < this.versions.length - 1) {
      this.versions = this.versions.slice(0, this.currentVersionIndex + 1);
    }

    // Add new version
    this.versions.push(snapshot);
    this.currentVersionIndex = this.versions.length - 1;

    // Enforce max versions limit
    if (this.versions.length > this.config.maxVersions) {
      const removeCount = this.versions.length - this.config.maxVersions;
      this.versions = this.versions.slice(removeCount);
      this.currentVersionIndex -= removeCount;
    }

    // Persist to storage
    if (this.config.persistToLocalStorage) {
      this.saveVersionsToStorage();
    }

    logGovernanceEvent({
      type: 'version-saved',
      metadata: { versionId, autoSaved, description },
      timestamp: Date.now(),
    });

    return versionId;
  }

  /**
   * Update the current manifest for auto-save tracking
   */
  updateCurrentManifest(manifest: ProjectManifest): void {
    this.lastSavedManifest = manifest;
  }

  /**
   * Restore a specific version
   */
  restoreVersion(versionId: string): ProjectManifest | null {
    const versionIndex = this.versions.findIndex(v => v.id === versionId);

    if (versionIndex === -1) {
      return null;
    }

    this.currentVersionIndex = versionIndex;
    const snapshot = this.versions[versionIndex];

    logGovernanceEvent({
      type: 'version-restored',
      metadata: { versionId },
      timestamp: Date.now(),
    });

    return JSON.parse(JSON.stringify(snapshot.manifest)); // Deep clone
  }

  /**
   * Undo to previous version
   */
  undo(): ProjectManifest | null {
    if (this.currentVersionIndex <= 0) {
      return null;
    }

    this.currentVersionIndex--;
    const snapshot = this.versions[this.currentVersionIndex];

    logGovernanceEvent({
      type: 'version-undo',
      metadata: { versionId: snapshot.id },
      timestamp: Date.now(),
    });

    return JSON.parse(JSON.stringify(snapshot.manifest)); // Deep clone
  }

  /**
   * Redo to next version
   */
  redo(): ProjectManifest | null {
    if (this.currentVersionIndex >= this.versions.length - 1) {
      return null;
    }

    this.currentVersionIndex++;
    const snapshot = this.versions[this.currentVersionIndex];

    logGovernanceEvent({
      type: 'version-redo',
      metadata: { versionId: snapshot.id },
      timestamp: Date.now(),
    });

    return JSON.parse(JSON.stringify(snapshot.manifest)); // Deep clone
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentVersionIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentVersionIndex < this.versions.length - 1;
  }

  /**
   * Get all version snapshots
   */
  getVersionHistory(): VersionSnapshot[] {
    return [...this.versions];
  }

  /**
   * Get current version
   */
  getCurrentVersion(): VersionSnapshot | null {
    if (this.currentVersionIndex < 0 || this.currentVersionIndex >= this.versions.length) {
      return null;
    }

    return this.versions[this.currentVersionIndex];
  }

  /**
   * Clear all versions
   */
  clearVersionHistory(): void {
    this.versions = [];
    this.currentVersionIndex = -1;

    if (this.config.persistToLocalStorage) {
      localStorage.removeItem('version-control-snapshots');
    }

    logGovernanceEvent({
      type: 'version-history-cleared',
      timestamp: Date.now(),
    });
  }

  /**
   * Save versions to localStorage
   */
  private saveVersionsToStorage(): void {
    try {
      const data = {
        versions: this.versions,
        currentVersionIndex: this.currentVersionIndex,
      };

      localStorage.setItem('version-control-snapshots', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save versions to storage:', error);
    }
  }

  /**
   * Load versions from localStorage
   */
  private loadVersionsFromStorage(): void {
    try {
      const stored = localStorage.getItem('version-control-snapshots');

      if (stored) {
        const data = JSON.parse(stored);
        this.versions = data.versions || [];
        this.currentVersionIndex = data.currentVersionIndex ?? -1;

        logGovernanceEvent({
          type: 'versions-loaded-from-storage',
          metadata: { versionCount: this.versions.length },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to load versions from storage:', error);
    }
  }

  /**
   * Export version history
   */
  exportVersionHistory(): {
    versions: VersionSnapshot[];
    currentVersionIndex: number;
    config: VersionControlConfig;
  } {
    return {
      versions: this.versions,
      currentVersionIndex: this.currentVersionIndex,
      config: this.config,
    };
  }

  /**
   * Import version history
   */
  importVersionHistory(data: {
    versions: VersionSnapshot[];
    currentVersionIndex: number;
  }): void {
    this.versions = data.versions;
    this.currentVersionIndex = data.currentVersionIndex;

    if (this.config.persistToLocalStorage) {
      this.saveVersionsToStorage();
    }

    logGovernanceEvent({
      type: 'version-history-imported',
      metadata: { versionCount: this.versions.length },
      timestamp: Date.now(),
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VersionControlConfig>): void {
    const oldAutoSaveEnabled = this.config.autoSaveEnabled;
    this.config = { ...this.config, ...config };

    // Restart auto-save if enabled state changed
    if (this.config.autoSaveEnabled && !oldAutoSaveEnabled) {
      this.startAutoSave();
    } else if (!this.config.autoSaveEnabled && oldAutoSaveEnabled) {
      this.stopAutoSave();
    }

    logGovernanceEvent({
      type: 'version-control-config-updated',
      metadata: { config: this.config },
      timestamp: Date.now(),
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): VersionControlConfig {
    return { ...this.config };
  }

  /**
   * Cleanup and stop auto-save
   */
  cleanup(): void {
    this.stopAutoSave();

    logGovernanceEvent({
      type: 'version-control-cleanup',
      timestamp: Date.now(),
    });
  }
}

/**
 * Singleton instance for global access
 */
let globalVersionControl: VersionControlHooks | null = null;

/**
 * Initialize global version control
 */
export function initializeVersionControl(config: VersionControlConfig): VersionControlHooks {
  globalVersionControl = new VersionControlHooks(config);
  globalVersionControl.initialize();
  return globalVersionControl;
}

/**
 * Get global version control instance
 */
export function getVersionControl(): VersionControlHooks {
  if (!globalVersionControl) {
    throw new Error('Version control not initialized. Call initializeVersionControl first.');
  }
  return globalVersionControl;
}

/**
 * Default version control configuration
 */
export const DEFAULT_VERSION_CONTROL_CONFIG: VersionControlConfig = {
  autoSaveEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  maxVersions: 100,
  persistToLocalStorage: true,
};
