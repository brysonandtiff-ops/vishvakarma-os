# GOVERNANCE ENFORCEMENT — QUICK START GUIDE

## For Developers

### Basic Usage

```typescript
import { enforce } from '@/governance/core/enforcer';
import { createSnapshot } from '@/governance/snapshots/snapshotManager';

// Validate a manifest before saving
const result = enforce(manifest);

if (result.success) {
  // Create snapshot on success
  createSnapshot(manifest, 'development', true);
  // Proceed with save
  await saveProject(manifest);
} else {
  console.error('Validation failed:', result.errors);
}
```

### Mode Switching

```typescript
import { enableDevelopmentMode, enableProductionMode } from '@/governance/core/enforcer';

// Development mode (auto-repair enabled)
enableDevelopmentMode();

// Production mode (strict enforcement)
enableProductionMode();
```

### Snapshot Management

```typescript
import { 
  createSnapshot, 
  detectCorruption, 
  rollbackToLastValid 
} from '@/governance/snapshots/snapshotManager';

// Create snapshot
const snapshot = createSnapshot(manifest, 'development', true);

// Check for corruption
if (detectCorruption()) {
  // Rollback to last valid state
  const rollback = rollbackToLastValid();
  console.log('Rolled back to:', rollback.snapshotId);
}
```

### Spec Validation

```typescript
import { validateSpec, getSystemSpecHash } from '@/governance/core/specHash';

// Validate a specific spec
const result = validateSpec('blueprint-editor');

if (!result.valid) {
  console.error('Spec validation failed:', result.message);
}

// Get system spec hash
const hash = getSystemSpecHash();
console.log('System spec hash:', hash);
```

## For CI/CD

### Release gate check

```bash
pnpm run contract:gates
pnpm run release:gates
pnpm run build
```

### Package.json (current)

```json
{
  "scripts": {
    "build": "vite build",
    "release:gates": "node scripts/verify-all.js",
    "ci": "pnpm run lint && pnpm run contract:gates && ..."
  }
}
```

## Common Scenarios

### Scenario 1: Save Project

```typescript
async function saveProject(manifest: ProjectManifest) {
  // 1. Validate
  const result = enforce(manifest);
  
  if (!result.success) {
    throw new Error(`Save blocked: ${result.errors.join(', ')}`);
  }
  
  // 2. Create snapshot
  createSnapshot(manifest, 'development', true);
  
  // 3. Export
  await exportJSON(manifest);
}
```

### Scenario 2: Load Project

```typescript
async function loadProject(file: File) {
  // 1. Import
  const manifest = await importJSON(file);
  
  // 2. Validate
  const result = enforce(manifest);
  
  if (!result.success) {
    throw new Error(`Load blocked: ${result.errors.join(', ')}`);
  }
  
  // 3. Create snapshot
  createSnapshot(manifest, 'development', true);
  
  return manifest;
}
```

### Scenario 3: Detect and Recover from Corruption

```typescript
function checkSystemHealth() {
  // Detect corruption
  if (detectCorruption()) {
    console.warn('Corruption detected, rolling back...');
    
    // Rollback
    const rollback = rollbackToLastValid();
    
    if (rollback.success) {
      console.log('Successfully rolled back to:', rollback.snapshotId);
      return true;
    } else {
      console.error('Rollback failed:', rollback.message);
      return false;
    }
  }
  
  return true;
}
```

## Troubleshooting

### Issue: Enforcement fails on startup

**Solution**: Check console for errors, review auto-repair actions

```typescript
const result = enforce();
console.log('Errors:', result.errors);
console.log('Repairs:', result.repairs);
```

### Issue: Build blocked by spec mismatch

**Solution**: Create formal Change Request, update approved spec hash

```typescript
import { checkChangeRequestRequired } from '@/governance/core/specHash';

const cr = checkChangeRequestRequired('blueprint-editor', newHash);
if (cr.required) {
  console.log('Change request required:', cr.reason);
}
```

### Issue: Snapshot chain corrupted

**Solution**: Rollback to last valid snapshot

```typescript
import { rollbackToLastValid } from '@/governance/snapshots/snapshotManager';

const rollback = rollbackToLastValid();
console.log('Rollback result:', rollback);
```

## Best Practices

1. **Always validate before critical operations**
2. **Create snapshots on successful saves**
3. **Use development mode locally**
4. **Enable production mode in production**
5. **Monitor enforcement metrics**
6. **Review auto-repair actions**
7. **Test with red team tests**

## Quick Reference

### Enforcer API
- `enforce(manifest?)` - Run enforcement
- `configureEnforcement(config)` - Configure
- `enableDevelopmentMode()` - Dev mode
- `enableProductionMode()` - Prod mode

### Snapshot API
- `createSnapshot(manifest, mode, passed)` - Create
- `detectCorruption()` - Check integrity
- `rollbackToLastValid()` - Rollback
- `getLatestSnapshot()` - Get latest

### Spec Hash API
- `validateSpec(name)` - Validate spec
- `validateAllSpecs()` - Validate all
- `getSystemSpecHash()` - Get hash
- `blockBuildOnSpecMismatch()` - Block build

## Documentation

- **Full Guide**: `src/governance/README.md`
- **Implementation**: `docs/GOVERNANCE_IMPLEMENTATION.md`
- **Verification**: `GOVERNANCE_VERIFICATION.txt`

---

**GOVERNANCE ENFORCEMENT SYSTEM v1.0.0**  
**Quick Start Guide — Ready for Use** ✅
