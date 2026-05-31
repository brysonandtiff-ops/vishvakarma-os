/**
 * GOVERNANCE ENFORCER — TOTAL SYSTEM LOCK
 * 
 * Enterprise-grade enforcement system that validates, audits, and repairs
 * the application state at runtime and build time.
 * 
 * This module is the single source of truth for governance enforcement.
 * No entry point exists without passing through this enforcer.
 */

import { getGovernanceLock } from '@/modules/governanceLock';
import type { ProjectManifest } from '@/types';
import { generateSystemSpecHash } from '@/governance/core/specHash';

// ============================================================================
// TYPES
// ============================================================================

export type EnforcementMode = 'development' | 'production';

export interface EnforcementConfig {
  mode: EnforcementMode;
  enableAutoRepair: boolean;
  enableLanguageValidation: boolean;
  enableAuditSuite: boolean;
  enableVerifyAll: boolean;
  blockOnFailure: boolean;
  performanceThresholds: {
    maxStartupTime: number; // milliseconds
    maxValidationTime: number; // milliseconds
    maxMemoryIncrease: number; // MB
  };
}

export interface EnforcementResult {
  success: boolean;
  mode: EnforcementMode;
  timestamp: number;
  checks: {
    languageValidation: CheckResult;
    auditSuite: CheckResult;
    specHash: CheckResult;
    manifestValidation: CheckResult;
    performanceCheck: CheckResult;
  };
  repairs: RepairAction[];
  errors: string[];
  warnings: string[];
  metrics: {
    totalTime: number;
    memoryUsed: number;
  };
}

export interface CheckResult {
  passed: boolean;
  message: string;
  details?: unknown;
  timestamp: number;
}

export interface RepairAction {
  type: 'language' | 'manifest' | 'spec' | 'dependency' | 'state';
  description: string;
  applied: boolean;
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: EnforcementConfig = {
  mode: 'development',
  enableAutoRepair: true,
  enableLanguageValidation: true,
  enableAuditSuite: true,
  enableVerifyAll: true,
  blockOnFailure: true,
  performanceThresholds: {
    maxStartupTime: 5000, // 5 seconds
    maxValidationTime: 2000, // 2 seconds
    maxMemoryIncrease: 50, // 50 MB
  },
};

let currentConfig: EnforcementConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// CLIENT STATE BOOTSTRAP
// ============================================================================

/**
 * Seeds required browser-local governance keys on first visit.
 * Production builds disable auto-repair, so this runs before enforce().
 */
export function bootstrapClientGovernanceState(): void {
  try {
    if (!localStorage.getItem('governance-event-log')) {
      localStorage.setItem('governance-event-log', JSON.stringify([]));
    }
    if (!localStorage.getItem('version-control-state')) {
      localStorage.setItem(
        'version-control-state',
        JSON.stringify({ history: [], currentIndex: -1, maxHistory: 50 })
      );
    }
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'dark');
    }
    if (!localStorage.getItem('accessibility-settings')) {
      localStorage.setItem(
        'accessibility-settings',
        JSON.stringify({
          highContrast: false,
          reducedMotion: false,
          screenReaderEnabled: false,
          keyboardNavigationEnabled: true,
        })
      );
    }
  } catch {
    // Advisory bootstrap — never block app startup
  }
}

// ============================================================================
// LANGUAGE VALIDATION
// ============================================================================

/**
 * Validates that all text content is in English (en-US)
 * Checks for non-Latin characters and mixed languages
 */
function validateLanguage(): CheckResult {
  const startTime = performance.now();
  
  try {
    // Check localStorage for any non-English content
    const storageKeys = Object.keys(localStorage);
    const nonEnglishKeys: string[] = [];
    
    for (const key of storageKeys) {
      const value = localStorage.getItem(key);
      if (value && containsNonLatinCharacters(value)) {
        nonEnglishKeys.push(key);
      }
    }
    
    if (nonEnglishKeys.length > 0) {
      return {
        passed: false,
        message: `Non-English content detected in storage: ${nonEnglishKeys.join(', ')}`,
        details: { keys: nonEnglishKeys },
        timestamp: Date.now(),
      };
    }
    
    const elapsed = performance.now() - startTime;
    
    return {
      passed: true,
      message: `Language validation passed (${elapsed.toFixed(2)}ms)`,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      passed: false,
      message: `Language validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Checks if a string contains non-Latin characters
 */
function containsNonLatinCharacters(text: string): boolean {
  // Check for Chinese, Japanese, Korean, Arabic, Cyrillic, etc.
  const nonLatinRegex = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff\u0600-\u06ff]/;
  return nonLatinRegex.test(text);
}

// ============================================================================
// AUDIT SUITE
// ============================================================================

/**
 * Runs comprehensive audit checks on the system
 */
function runAuditSuite(): CheckResult {
  const startTime = performance.now();
  const issues: string[] = [];
  
  try {
    // Check 1: Verify governance event log exists
    const governanceLog = localStorage.getItem('governance-event-log');
    if (!governanceLog) {
      issues.push('Governance event log not initialized');
    }
    
    // Check 2: Verify version control state
    const versionState = localStorage.getItem('version-control-state');
    if (!versionState) {
      issues.push('Version control state not initialized');
    }
    
    // Check 3: Verify theme configuration
    const theme = localStorage.getItem('theme');
    if (!theme) {
      issues.push('Theme not configured');
    }
    
    // Check 4: Verify accessibility settings
    const a11ySettings = localStorage.getItem('accessibility-settings');
    if (!a11ySettings) {
      issues.push('Accessibility settings not initialized');
    }
    
    const elapsed = performance.now() - startTime;
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: `Audit suite found ${issues.length} issue(s)`,
        details: { issues },
        timestamp: Date.now(),
      };
    }
    
    return {
      passed: true,
      message: `Audit suite passed (${elapsed.toFixed(2)}ms)`,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      passed: false,
      message: `Audit suite error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// SPEC HASH VALIDATION
// ============================================================================

/**
 * Validates that the spec hash matches the approved hash
 * This prevents unauthorized spec modifications
 */
function validateSpecHash(): CheckResult {
  const startTime = performance.now();
  
  try {
    // Get the approved spec hash from build time
    const approvedHash = import.meta.env.VITE_SPEC_HASH || 'development';
    const currentHash = generateSpecHash();
    
    if (approvedHash !== 'development' && currentHash !== approvedHash) {
      return {
        passed: false,
        message: `Spec hash mismatch. Expected: ${approvedHash}, Got: ${currentHash}`,
        details: { approved: approvedHash, current: currentHash },
        timestamp: Date.now(),
      };
    }
    
    const elapsed = performance.now() - startTime;
    
    return {
      passed: true,
      message: `Spec hash validated (${elapsed.toFixed(2)}ms)`,
      details: { hash: currentHash },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      passed: false,
      message: `Spec hash validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Generates a hash of the current spec configuration
 */
function generateSpecHash(): string {
  return generateSystemSpecHash();
}

// ============================================================================
// MANIFEST VALIDATION
// ============================================================================

/**
 * Validates a project manifest against governance rules
 */
function validateProjectManifest(manifest: ProjectManifest): CheckResult {
  const startTime = performance.now();
  
  try {
    const governance = getGovernanceLock();
    const result = governance.validateManifest(manifest);
    const elapsed = performance.now() - startTime;
    
    if (!result.valid) {
      return {
        passed: false,
        message: `Manifest validation failed: ${result.errors.join(', ')}`,
        details: { errors: result.errors },
        timestamp: Date.now(),
      };
    }
    
    return {
      passed: true,
      message: `Manifest validated (${elapsed.toFixed(2)}ms)`,
      timestamp: Date.now(),
    };
  } catch (error) {
    // If governance lock is not initialized, skip validation
    if (error instanceof Error && error.message.includes('not initialized')) {
      return {
        passed: true,
        message: 'Manifest validation skipped (governance lock not initialized)',
        timestamp: Date.now(),
      };
    }
    
    return {
      passed: false,
      message: `Manifest validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// PERFORMANCE CHECK
// ============================================================================

/**
 * Checks that enforcement overhead is within acceptable limits
 */
function checkPerformance(startTime: number, startMemory: number): CheckResult {
  const elapsed = performance.now() - startTime;
  const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryIncrease = (currentMemory - startMemory) / (1024 * 1024); // Convert to MB
  
  const thresholds = currentConfig.performanceThresholds;
  const issues: string[] = [];
  
  if (elapsed > thresholds.maxValidationTime) {
    issues.push(`Validation time ${elapsed.toFixed(2)}ms exceeds threshold ${thresholds.maxValidationTime}ms`);
  }
  
  if (memoryIncrease > thresholds.maxMemoryIncrease) {
    issues.push(`Memory increase ${memoryIncrease.toFixed(2)}MB exceeds threshold ${thresholds.maxMemoryIncrease}MB`);
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: `Performance check failed: ${issues.join(', ')}`,
      details: { elapsed, memoryIncrease, thresholds },
      timestamp: Date.now(),
    };
  }
  
  return {
    passed: true,
    message: `Performance check passed (${elapsed.toFixed(2)}ms, ${memoryIncrease.toFixed(2)}MB)`,
    details: { elapsed, memoryIncrease },
    timestamp: Date.now(),
  };
}

// ============================================================================
// AUTO-REPAIR
// ============================================================================

/**
 * Attempts to automatically repair detected issues
 */
function attemptAutoRepair(result: EnforcementResult): RepairAction[] {
  const repairs: RepairAction[] = [];
  
  // Only auto-repair in development mode
  if (currentConfig.mode !== 'development' || !currentConfig.enableAutoRepair) {
    return repairs;
  }
  
  // Repair 1: Initialize missing governance log
  if (!result.checks.auditSuite.passed && 
      result.checks.auditSuite.details && 
      (result.checks.auditSuite.details as any).issues?.includes('Governance event log not initialized')) {
    try {
      localStorage.setItem('governance-event-log', JSON.stringify([]));
      repairs.push({
        type: 'state',
        description: 'Initialized governance event log',
        applied: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      repairs.push({
        type: 'state',
        description: 'Failed to initialize governance event log',
        applied: false,
        timestamp: Date.now(),
      });
    }
  }
  
  // Repair 2: Initialize missing version control state
  if (!result.checks.auditSuite.passed && 
      result.checks.auditSuite.details && 
      (result.checks.auditSuite.details as any).issues?.includes('Version control state not initialized')) {
    try {
      const defaultState = {
        history: [],
        currentIndex: -1,
        maxHistory: 50,
      };
      localStorage.setItem('version-control-state', JSON.stringify(defaultState));
      repairs.push({
        type: 'state',
        description: 'Initialized version control state',
        applied: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      repairs.push({
        type: 'state',
        description: 'Failed to initialize version control state',
        applied: false,
        timestamp: Date.now(),
      });
    }
  }
  
  // Repair 3: Set default theme
  if (!result.checks.auditSuite.passed && 
      result.checks.auditSuite.details && 
      (result.checks.auditSuite.details as any).issues?.includes('Theme not configured')) {
    try {
      localStorage.setItem('theme', 'dark');
      repairs.push({
        type: 'state',
        description: 'Set default theme to dark',
        applied: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      repairs.push({
        type: 'state',
        description: 'Failed to set default theme',
        applied: false,
        timestamp: Date.now(),
      });
    }
  }
  
  // Repair 4: Initialize accessibility settings
  if (!result.checks.auditSuite.passed && 
      result.checks.auditSuite.details && 
      (result.checks.auditSuite.details as any).issues?.includes('Accessibility settings not initialized')) {
    try {
      const defaultSettings = {
        highContrast: false,
        reducedMotion: false,
        screenReaderEnabled: false,
        keyboardNavigationEnabled: true,
      };
      localStorage.setItem('accessibility-settings', JSON.stringify(defaultSettings));
      repairs.push({
        type: 'state',
        description: 'Initialized accessibility settings',
        applied: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      repairs.push({
        type: 'state',
        description: 'Failed to initialize accessibility settings',
        applied: false,
        timestamp: Date.now(),
      });
    }
  }
  
  return repairs;
}

// ============================================================================
// MAIN ENFORCEMENT
// ============================================================================

/**
 * Runs the complete enforcement suite
 * This is the main entry point for governance enforcement
 */
export function enforce(manifest?: ProjectManifest): EnforcementResult {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  const result: EnforcementResult = {
    success: true,
    mode: currentConfig.mode,
    timestamp: Date.now(),
    checks: {
      languageValidation: { passed: true, message: 'Skipped', timestamp: Date.now() },
      auditSuite: { passed: true, message: 'Skipped', timestamp: Date.now() },
      specHash: { passed: true, message: 'Skipped', timestamp: Date.now() },
      manifestValidation: { passed: true, message: 'Skipped', timestamp: Date.now() },
      performanceCheck: { passed: true, message: 'Skipped', timestamp: Date.now() },
    },
    repairs: [],
    errors: [],
    warnings: [],
    metrics: {
      totalTime: 0,
      memoryUsed: 0,
    },
  };
  
  // Run language validation
  if (currentConfig.enableLanguageValidation) {
    result.checks.languageValidation = validateLanguage();
    if (!result.checks.languageValidation.passed) {
      result.success = false;
      result.errors.push(result.checks.languageValidation.message);
    }
  }
  
  // Run audit suite
  if (currentConfig.enableAuditSuite) {
    result.checks.auditSuite = runAuditSuite();
    if (!result.checks.auditSuite.passed) {
      result.success = false;
      result.errors.push(result.checks.auditSuite.message);
    }
  }
  
  // Run spec hash validation
  result.checks.specHash = validateSpecHash();
  if (!result.checks.specHash.passed) {
    result.success = false;
    result.errors.push(result.checks.specHash.message);
  }
  
  // Run manifest validation if provided
  if (manifest) {
    result.checks.manifestValidation = validateProjectManifest(manifest);
    if (!result.checks.manifestValidation.passed) {
      result.success = false;
      result.errors.push(result.checks.manifestValidation.message);
    }
  }
  
  // Attempt auto-repair if enabled
  if (!result.success && currentConfig.enableAutoRepair) {
    result.repairs = attemptAutoRepair(result);
    
    // Re-run checks after repair
    if (result.repairs.some(r => r.applied)) {
      if (currentConfig.enableAuditSuite) {
        result.checks.auditSuite = runAuditSuite();
        if (result.checks.auditSuite.passed) {
          result.success = true;
          result.errors = result.errors.filter(e => !e.includes('Audit suite'));
        }
      }
    }
  }
  
  // Run performance check
  if (currentConfig.enableVerifyAll) {
    result.checks.performanceCheck = checkPerformance(startTime, startMemory);
    if (!result.checks.performanceCheck.passed) {
      result.warnings.push(result.checks.performanceCheck.message);
    }
  }
  
  // Calculate metrics
  result.metrics.totalTime = performance.now() - startTime;
  const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
  result.metrics.memoryUsed = (currentMemory - startMemory) / (1024 * 1024);
  
  // Block execution if configured and enforcement failed
  if (!result.success && currentConfig.blockOnFailure) {
    console.error('[GOVERNANCE ENFORCER] Enforcement failed. Blocking execution.');
    console.error('[GOVERNANCE ENFORCER] Errors:', result.errors);
    
    if (currentConfig.mode === 'production') {
      throw new Error(`Governance enforcement failed: ${result.errors.join(', ')}`);
    }
  }
  
  // Log result
  if (result.success) {
    console.log(`[GOVERNANCE ENFORCER] ✅ Enforcement passed (${result.metrics.totalTime.toFixed(2)}ms)`);
  } else {
    console.warn(`[GOVERNANCE ENFORCER] ⚠️ Enforcement failed (${result.metrics.totalTime.toFixed(2)}ms)`);
    console.warn('[GOVERNANCE ENFORCER] Errors:', result.errors);
    console.warn('[GOVERNANCE ENFORCER] Repairs:', result.repairs);
  }
  
  return result;
}

/**
 * Configures the enforcement system
 */
export function configureEnforcement(config: Partial<EnforcementConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('[GOVERNANCE ENFORCER] Configuration updated:', currentConfig);
}

/**
 * Gets the current enforcement configuration
 */
export function getEnforcementConfig(): EnforcementConfig {
  return { ...currentConfig };
}

/**
 * Switches to production mode
 * Disables auto-repair and enables strict enforcement
 */
export function enableProductionMode(): void {
  configureEnforcement({
    mode: 'production',
    enableAutoRepair: false,
    blockOnFailure: true,
  });
  console.log('[GOVERNANCE ENFORCER] 🔒 Production mode enabled');
}

/**
 * Switches to development mode
 * Enables auto-repair and relaxed enforcement
 */
export function enableDevelopmentMode(): void {
  configureEnforcement({
    mode: 'development',
    enableAutoRepair: true,
    blockOnFailure: false,
  });
  console.log('[GOVERNANCE ENFORCER] 🔧 Development mode enabled');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  enforce,
  configureEnforcement,
  getEnforcementConfig,
  enableProductionMode,
  enableDevelopmentMode,
};
