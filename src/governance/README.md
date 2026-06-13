# GOVERNANCE ENFORCEMENT SYSTEM — COMPLETE DOCUMENTATION

**Version**: 1.0.0  
**Status**: PRODUCTION READY  
**Date**: 2026-02-15

---

## Overview

The Governance Enforcement System is an enterprise-grade framework that provides:

- **Self-validating**: Automatic validation at runtime and build time
- **Self-repairing**: Auto-repair in development mode
- **Self-protecting**: Strict enforcement in production mode
- **Spec-bound**: Immutable spec hash validation
- **Drift-resistant**: Continuous integrity monitoring
- **Deterministic**: Replayable state with snapshot chain

---

## Architecture

### Core Components

```
governance/
├── core/
│   ├── enforcer.ts          # Main enforcement engine
│   └── specHash.ts          # Immutable spec hash system
├── snapshots/
│   └── snapshotManager.ts   # Snapshot protection system
└── README.md                # This file
```

### Integration Points

1. **App Startup** (`src/main.tsx`)
   - Runs enforcement check on application initialization
   - Auto-repairs missing dependencies
   - Validates language and state consistency

2. **Save Actions** (`src/modules/export.ts`)
   - Validates manifest before export
   - Creates immutable snapshot on successful save
   - Blocks save on governance violations

3. **Build Pipeline** (`scripts/quality/` gate scripts + `pnpm run release:gates`)
   - Validates spec hashes at build time
   - Blocks build on spec mismatch
   - Requires formal change request for spec modifications

---

## Phase 1: Core Enforcer

### Purpose
Provides runtime validation, audit, auto-repair, and execution blocking.

### Features

- **Language Validation**: Ensures all content is English-only
- **Audit Suite**: Validates system state and dependencies
- **Spec Hash Validation**: Prevents unauthorized spec changes
- **Manifest Validation**: Validates project manifests against governance rules
- **Performance Monitoring**: Tracks enforcement overhead
- **Auto-Repair**: Automatically fixes detected issues (dev mode only)

### Usage

```typescript
import { enforce, enableDevelopmentMode, enableProductionMode } from '@/governance/core/enforcer';

// Enable development mode (auto-repair enabled)
enableDevelopmentMode();

// Run enforcement
const result = enforce(manifest);

if (!result.success) {
  console.error('Enforcement failed:', result.errors);
  console.log('Repairs applied:', result.repairs);
}

// Switch to production mode (auto-repair disabled)
enableProductionMode();
```

### Configuration

```typescript
import { configureEnforcement } from '@/governance/core/enforcer';

configureEnforcement({
  mode: 'development',
  enableAutoRepair: true,
  enableLanguageValidation: true,
  enableAuditSuite: true,
  enableVerifyAll: true,
  blockOnFailure: false,
  performanceThresholds: {
    maxStartupTime: 5000,      // 5 seconds
    maxValidationTime: 2000,   // 2 seconds
    maxMemoryIncrease: 50,     // 50 MB
  },
});
```

### Enforcement Result

```typescript
interface EnforcementResult {
  success: boolean;
  mode: 'development' | 'production';
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
```

---

## Phase 2: Snapshot Protection

### Purpose
Provides immutable snapshot system with hash chain tracking for corruption detection and automatic rollback.

### Features

- **Immutable Snapshots**: Every successful verification creates a snapshot
- **Hash Chain**: Cryptographic chain linking all snapshots
- **Corruption Detection**: Automatic detection of tampered snapshots
- **Auto-Rollback**: Rollback to last valid state on corruption
- **Chain Verification**: Validates entire snapshot chain integrity

### Usage

```typescript
import { 
  createSnapshot, 
  detectCorruption, 
  rollbackToLastValid,
  getLatestSnapshot,
  getChainStatus 
} from '@/governance/snapshots/snapshotManager';

// Create snapshot
const snapshot = createSnapshot(manifest, 'development', true);

// Detect corruption
const isCorrupted = detectCorruption();

if (isCorrupted) {
  // Rollback to last valid snapshot
  const rollback = rollbackToLastValid();
  console.log('Rolled back to:', rollback.snapshotId);
}

// Get chain status
const status = getChainStatus();
console.log('Snapshots:', status.snapshotCount);
console.log('Integrity:', status.chainIntegrity);
```

### Snapshot Structure

```typescript
interface Snapshot {
  id: string;
  timestamp: number;
  manifest: ProjectManifest;
  hash: string;
  previousHash: string | null;
  chainHash: string;
  metadata: {
    version: string;
    mode: 'development' | 'production';
    enforcementPassed: boolean;
  };
}
```

---

## Phase 3: Immutable Spec Hash

### Purpose
Prevents unauthorized specification changes by validating spec hashes at build time.

### Features

- **Approved Spec Hashes**: Locked spec definitions
- **Build Blocking**: Blocks builds on spec mismatch
- **Change Request Requirement**: Requires formal CR for spec changes
- **Spec Validation**: Validates individual and system-wide specs

### Usage

```typescript
import { 
  validateSpec, 
  blockBuildOnSpecMismatch,
  checkChangeRequestRequired,
  getSystemSpecHash 
} from '@/governance/core/specHash';

// Validate a specific spec
const result = validateSpec('blueprint-editor');

if (!result.valid) {
  console.error('Spec validation failed:', result.message);
}

// Check if change request is required
const crRequired = checkChangeRequestRequired('blueprint-editor', newHash);

if (crRequired.required) {
  console.log('Change request required:', crRequired.reason);
}

// Get system spec hash
const systemHash = getSystemSpecHash();
console.log('System spec hash:', systemHash);

// Block build on spec mismatch (use in build pipeline)
blockBuildOnSpecMismatch();
```

### Approved Specs

```typescript
const APPROVED_SPECS = {
  'blueprint-editor': {
    name: 'Blueprint Editor v1.0.0',
    version: '1.0.0',
    hash: 'd5fe8a1c2b9d4e3f',
    locked: true,
  },
  'data-model': {
    name: 'Data Model Specification',
    version: '1.0.0',
    hash: 'a3c7b9e1f2d4c8a6',
    locked: true,
  },
  // ... more specs
};
```

---

## Phase 4: Red Team Testing

### Purpose
Adversarial testing to validate auto-repair and verification capabilities.

### Test Categories

1. **Corrupted Manifest**: Tests handling of invalid manifest data
2. **Missing Dependencies**: Tests detection and repair of missing state
3. **Invalid Schema**: Tests rejection of schema violations
4. **Snapshot Corruption**: Tests corruption detection and rollback
5. **Language Injection**: Tests non-English content detection
6. **Spec Hash Tampering**: Tests spec hash validation
7. **Performance Degradation**: Tests performance monitoring
8. **State Inconsistency**: Tests state repair capabilities
9. **Production Mode Bypass**: Tests production mode enforcement
10. **Concurrent Corruption**: Tests handling of multiple issues

### Running Tests

```bash
npm run test -- src/test/redTeam.test.ts
```

### Test Results

All red team tests must pass before production deployment:

```
✅ Attack 1: Corrupted Manifest
✅ Attack 2: Missing Dependencies
✅ Attack 3: Invalid Schema
✅ Attack 4: Snapshot Corruption
✅ Attack 5: Language Injection
✅ Attack 6: Spec Hash Tampering
✅ Attack 7: Performance Degradation
✅ Attack 8: State Inconsistency
✅ Attack 9: Production Mode Bypass
✅ Attack 10: Concurrent Corruption
```

---

## Phase 5: Performance Lock

### Purpose
Ensures enforcement overhead remains within acceptable limits.

### Metrics

- **Cold Start Time**: < 5 seconds
- **Validation Time**: < 2 seconds
- **Memory Increase**: < 50 MB
- **Runtime Overhead**: < 100ms per operation

### Monitoring

```typescript
const result = enforce(manifest);

console.log('Total time:', result.metrics.totalTime, 'ms');
console.log('Memory used:', result.metrics.memoryUsed, 'MB');

if (!result.checks.performanceCheck.passed) {
  console.warn('Performance threshold exceeded');
}
```

### Optimization

If enforcement overhead exceeds thresholds:

1. Disable non-critical checks in production
2. Implement lazy validation
3. Cache validation results
4. Use Web Workers for heavy operations
5. Optimize hash algorithms

---

## Phase 6: Production Mode Switch

### Purpose
Switches between development and production governance modes.

### Development Mode

- **Auto-Repair**: Enabled
- **Block on Failure**: Disabled
- **Logging**: Verbose
- **Snapshots**: Frequent
- **Performance**: Relaxed thresholds

```typescript
enableDevelopmentMode();
```

### Production Mode

- **Auto-Repair**: Disabled
- **Block on Failure**: Enabled
- **Logging**: Minimal
- **Snapshots**: On success only
- **Performance**: Strict thresholds
- **Rollback Only**: No structural mutations

```typescript
enableProductionMode();
```

### Mode Switching

```typescript
// Detect environment
const isProduction = import.meta.env.PROD;

if (isProduction) {
  enableProductionMode();
} else {
  enableDevelopmentMode();
}
```

---

## Integration Guide

### Step 1: App Startup

Add enforcement to `src/main.tsx`:

```typescript
import { enforce, enableDevelopmentMode } from './governance/core/enforcer';

enableDevelopmentMode();
const result = enforce();

if (!result.success) {
  console.warn('Startup enforcement failed:', result.errors);
}
```

### Step 2: Save Actions

Add enforcement to save operations:

```typescript
import { enforce } from '@/governance/core/enforcer';
import { createSnapshot } from '@/governance/snapshots/snapshotManager';

async function saveProject(manifest: ProjectManifest) {
  // Validate before save
  const result = enforce(manifest);
  
  if (!result.success) {
    throw new Error(`Save blocked: ${result.errors.join(', ')}`);
  }
  
  // Create snapshot
  createSnapshot(manifest, 'development', true);
  
  // Proceed with save
  await exportJSON(manifest);
}
```

### Step 3: Build Pipeline

Current `package.json` uses gate scripts run before release, not inline build hooks:

```json
{
  "scripts": {
    "build": "vite build",
    "release:gates": "node scripts/verify-all.js",
    "contract:gates": "node scripts/quality/check-system-contract.mjs && ..."
  }
}
```

Run gates before shipping:

```bash
pnpm run verify:ci
pnpm run release:gates
```

### Step 4: CI/CD Integration

GitHub Actions (`.github/workflows/verify.yml`) runs:

```yaml
- name: CI verify
  run: pnpm run ci
```

---

## Troubleshooting

### Issue: Enforcement Fails on Startup

**Cause**: Missing dependencies or corrupted state

**Solution**:
1. Check console for specific errors
2. Review auto-repair actions
3. Clear localStorage if needed
4. Re-run enforcement

### Issue: Build Blocked by Spec Mismatch

**Cause**: Spec hash doesn't match approved hash

**Solution**:
1. Review spec changes
2. Create formal Change Request
3. Get approval
4. Update approved spec hash
5. Re-run build

### Issue: Snapshot Chain Corrupted

**Cause**: Manual tampering or storage corruption

**Solution**:
1. Run corruption detection
2. Rollback to last valid snapshot
3. Clear corrupted snapshots if needed
4. Re-create snapshot chain

### Issue: Performance Threshold Exceeded

**Cause**: Enforcement overhead too high

**Solution**:
1. Review performance metrics
2. Adjust thresholds if reasonable
3. Optimize validation logic
4. Disable non-critical checks in production

---

## Best Practices

### 1. Always Use Development Mode Locally

```typescript
if (import.meta.env.DEV) {
  enableDevelopmentMode();
}
```

### 2. Create Snapshots on Major Operations

```typescript
// After successful save
createSnapshot(manifest, 'development', true);

// After successful import
createSnapshot(importedManifest, 'development', true);
```

### 3. Validate Before Critical Operations

```typescript
// Before export
const result = enforce(manifest);
if (!result.success) {
  throw new Error('Export blocked');
}
```

### 4. Monitor Performance Regularly

```typescript
const result = enforce();
console.log('Enforcement time:', result.metrics.totalTime);

if (result.metrics.totalTime > 1000) {
  console.warn('Enforcement taking too long');
}
```

### 5. Use Spec Hash for Version Control

```typescript
const systemHash = getSystemSpecHash();
console.log('Current spec version:', systemHash);
```

---

## API Reference

### Enforcer API

```typescript
// Main enforcement
enforce(manifest?: ProjectManifest): EnforcementResult

// Configuration
configureEnforcement(config: Partial<EnforcementConfig>): void
getEnforcementConfig(): EnforcementConfig

// Mode switching
enableProductionMode(): void
enableDevelopmentMode(): void
```

### Snapshot API

```typescript
// Snapshot creation
createSnapshot(manifest: ProjectManifest, mode: string, passed: boolean): Snapshot

// Corruption detection
detectCorruption(): boolean

// Rollback
rollbackToLastValid(): RollbackResult
rollbackToSnapshot(id: string): RollbackResult

// Queries
getAllSnapshots(): Snapshot[]
getSnapshot(id: string): Snapshot | null
getLatestSnapshot(): Snapshot | null
getChainStatus(): ChainStatus
```

### Spec Hash API

```typescript
// Validation
validateSpec(name: string): SpecHashResult
validateAllSpecs(): Record<string, SpecHashResult>
compareWithApprovedHash(name: string, hash: string): SpecHashResult

// Change requests
checkChangeRequestRequired(name: string, hash: string): ChangeRequestRequirement

// Build blocking
blockBuildOnSpecMismatch(): void

// Queries
getAllApprovedSpecs(): SpecDefinition[]
getApprovedSpec(name: string): SpecDefinition | null
isSpecLocked(name: string): boolean
getSystemSpecHash(): string
```

---

## Conclusion

The Governance Enforcement System provides enterprise-grade protection for Vishvakarma.OS:

✅ **Self-Validating**: Automatic validation at all entry points  
✅ **Self-Repairing**: Auto-repair in development mode  
✅ **Self-Protecting**: Strict enforcement in production mode  
✅ **Spec-Bound**: Immutable spec hash validation  
✅ **Drift-Resistant**: Continuous integrity monitoring  
✅ **Deterministic**: Replayable state with snapshot chain

The system is production-ready and battle-tested through comprehensive red team testing.

---

**GOVERNANCE ENFORCEMENT SYSTEM v1.0.0 — COMPLETE** ✅
