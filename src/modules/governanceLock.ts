/**
 * Governance Lock Module
 * 
 * Enforces governance rules and prevents untracked changes.
 * All state modifications must go through this module to ensure
 * compliance with the governance framework.
 * 
 * Part of STEP 6 - Final Canvas & Governance Lock
 */

import type { ProjectManifest } from '@/types';
import { validateManifest } from '@/core/manifestSchema';

export interface GovernanceEvent {
  type: string;
  operation?: string;
  reason?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface GovernanceConfig {
  enforceValidation: boolean;
  preventDrift: boolean;
  logAllOperations: boolean;
  requireApproval: boolean;
}

export interface DriftCheckResult {
  hasDrift: boolean;
  driftDetails: string[];
  lastValidState?: ProjectManifest;
}

/**
 * Governance Lock Class
 * Enforces governance rules and tracks all changes
 */
export class GovernanceLock {
  private config: GovernanceConfig;
  private eventLog: GovernanceEvent[] = [];
  private lastValidatedState: ProjectManifest | null = null;
  private locked = false;

  constructor(config: GovernanceConfig) {
    this.config = config;
  }

  /**
   * Log a governance event
   */
  logEvent(event: GovernanceEvent): void {
    this.eventLog.push(event);

    if (this.config.logAllOperations) {
      import.meta.env?.DEV && console.log('[Governance]', event);
    }

    // Persist to localStorage for audit trail
    this.persistEventLog();
  }

  /**
   * Persist event log to localStorage
   */
  private persistEventLog(): void {
    try {
      const recentEvents = this.eventLog.slice(-100); // Keep last 100 events
      globalThis.localStorage?.setItem('governance-event-log', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to persist governance event log:', error);
    }
  }

  /**
   * Load event log from localStorage
   */
  loadEventLog(): void {
    try {
      const stored = globalThis.localStorage?.getItem('governance-event-log');
      if (stored) {
        this.eventLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load governance event log:', error);
    }
  }

  /**
   * Get all governance events
   */
  getEventLog(): GovernanceEvent[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = [];
    globalThis.localStorage?.removeItem('governance-event-log');
  }

  /**
   * Validate a project manifest
   */
  validateManifest(manifest: ProjectManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      validateManifest(manifest);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    // Additional governance checks
    if (!manifest.version) {
      errors.push('Manifest version is required');
    }

    if (!manifest.name) {
      errors.push('Project name is required');
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

    const valid = errors.length === 0;

    this.logEvent({
      type: 'manifest-validation',
      metadata: { valid, errorCount: errors.length },
      timestamp: Date.now(),
    });

    return { valid, errors };
  }

  /**
   * Check for drift between current state and last validated state
   */
  checkForDrift(currentManifest: ProjectManifest): DriftCheckResult {
    if (!this.config.preventDrift) {
      return { hasDrift: false, driftDetails: [] };
    }

    if (!this.lastValidatedState) {
      // No previous state to compare against
      return { hasDrift: false, driftDetails: [] };
    }

    const driftDetails: string[] = [];

    // Check wall count
    if (currentManifest.walls.length !== this.lastValidatedState.walls.length) {
      driftDetails.push(
        `Wall count changed: ${this.lastValidatedState.walls.length} → ${currentManifest.walls.length}`
      );
    }

    // Check opening count
    if (currentManifest.openings.length !== this.lastValidatedState.openings.length) {
      driftDetails.push(
        `Opening count changed: ${this.lastValidatedState.openings.length} → ${currentManifest.openings.length}`
      );
    }

    // Check for wall modifications
    const lastWallIds = new Set(this.lastValidatedState.walls.map(w => w.id));
    const currentWallIds = new Set(currentManifest.walls.map(w => w.id));

    const addedWalls = currentManifest.walls.filter(w => !lastWallIds.has(w.id));
    const removedWalls = this.lastValidatedState.walls.filter(w => !currentWallIds.has(w.id));

    if (addedWalls.length > 0) {
      driftDetails.push(`Added ${addedWalls.length} wall(s)`);
    }

    if (removedWalls.length > 0) {
      driftDetails.push(`Removed ${removedWalls.length} wall(s)`);
    }

    // Check for opening modifications
    const lastOpeningIds = new Set(this.lastValidatedState.openings.map(o => o.id));
    const currentOpeningIds = new Set(currentManifest.openings.map(o => o.id));

    const addedOpenings = currentManifest.openings.filter(o => !lastOpeningIds.has(o.id));
    const removedOpenings = this.lastValidatedState.openings.filter(o => !currentOpeningIds.has(o.id));

    if (addedOpenings.length > 0) {
      driftDetails.push(`Added ${addedOpenings.length} opening(s)`);
    }

    if (removedOpenings.length > 0) {
      driftDetails.push(`Removed ${removedOpenings.length} opening(s)`);
    }

    const hasDrift = driftDetails.length > 0;

    if (hasDrift) {
      this.logEvent({
        type: 'drift-detected',
        metadata: { driftDetails },
        timestamp: Date.now(),
      });
    }

    return {
      hasDrift,
      driftDetails,
      lastValidState: this.lastValidatedState,
    };
  }

  /**
   * Approve and lock a manifest as the validated state
   */
  approveManifest(manifest: ProjectManifest): boolean {
    if (!this.config.enforceValidation) {
      this.lastValidatedState = manifest;
      return true;
    }

    const validation = this.validateManifest(manifest);

    if (!validation.valid) {
      this.logEvent({
        type: 'manifest-approval-rejected',
        reason: validation.errors.join(', '),
        timestamp: Date.now(),
      });
      return false;
    }

    this.lastValidatedState = manifest;

    this.logEvent({
      type: 'manifest-approved',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Lock governance to prevent any changes
   */
  lock(): void {
    this.locked = true;
    this.logEvent({
      type: 'governance-locked',
      timestamp: Date.now(),
    });
  }

  /**
   * Unlock governance to allow changes
   */
  unlock(): void {
    this.locked = false;
    this.logEvent({
      type: 'governance-unlocked',
      timestamp: Date.now(),
    });
  }

  /**
   * Check if governance is locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get last validated state
   */
  getLastValidatedState(): ProjectManifest | null {
    return this.lastValidatedState;
  }

  /**
   * Update governance configuration
   */
  updateConfig(config: Partial<GovernanceConfig>): void {
    this.config = { ...this.config, ...config };

    this.logEvent({
      type: 'config-updated',
      metadata: { config: this.config },
      timestamp: Date.now(),
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): GovernanceConfig {
    return { ...this.config };
  }

  /**
   * Export governance report
   */
  exportReport(): {
    config: GovernanceConfig;
    eventLog: GovernanceEvent[];
    lastValidatedState: ProjectManifest | null;
    locked: boolean;
  } {
    return {
      config: this.config,
      eventLog: this.eventLog,
      lastValidatedState: this.lastValidatedState,
      locked: this.locked,
    };
  }
}

/**
 * Singleton instance for global access
 */
let globalGovernanceLock: GovernanceLock | null = null;

/**
 * Initialize global governance lock
 */
export function initializeGovernanceLock(config: GovernanceConfig): GovernanceLock {
  globalGovernanceLock = new GovernanceLock(config);
  globalGovernanceLock.loadEventLog();
  return globalGovernanceLock;
}

/**
 * Get global governance lock instance
 */
export function getGovernanceLock(): GovernanceLock {
  if (!globalGovernanceLock) {
    throw new Error('Governance lock not initialized. Call initializeGovernanceLock first.');
  }
  return globalGovernanceLock;
}

/**
 * Log a governance event (convenience function)
 */
export function logGovernanceEvent(event: GovernanceEvent): void {
  if (globalGovernanceLock) {
    globalGovernanceLock.logEvent(event);
  }
}

/**
 * Default governance configuration
 */
export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  enforceValidation: true,
  preventDrift: true,
  logAllOperations: true,
  requireApproval: false,
};
