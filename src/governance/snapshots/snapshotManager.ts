/**
 * SNAPSHOT PROTECTION SYSTEM
 * 
 * Immutable snapshot system with hash chain tracking for corruption detection
 * and automatic rollback capability.
 * 
 * Every successful verification creates an immutable snapshot.
 * If corruption is detected, the system can auto-rollback to the last valid state.
 */

import type { ProjectManifest } from '@/types';
import { sha256Hex } from '@/utils/sha256';

// ============================================================================
// TYPES
// ============================================================================

export interface Snapshot {
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

export interface SnapshotChain {
  snapshots: Snapshot[];
  currentHash: string;
  chainIntegrity: boolean;
}

export interface RollbackResult {
  success: boolean;
  snapshotId: string;
  timestamp: number;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SNAPSHOT_STORAGE_KEY = 'governance-snapshots';
const MAX_SNAPSHOTS = 10; // Keep last 10 snapshots
const CHAIN_SEED = 'vishvakarma-os-v1.0.0';

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Generates a hash for a manifest using SHA-256
 */
function hashManifest(manifest: ProjectManifest): string {
  const manifestString = JSON.stringify(manifest, Object.keys(manifest).sort());
  return sha256Hex(manifestString);
}

/**
 * Generates a chain hash from previous hash and current hash
 */
function generateChainHash(previousHash: string | null, currentHash: string): string {
  const input = `${previousHash || CHAIN_SEED}:${currentHash}`;
  return sha256Hex(input);
}

// ============================================================================
// SNAPSHOT STORAGE
// ============================================================================

/**
 * Loads the snapshot chain from storage
 */
function loadSnapshotChain(): SnapshotChain {
  try {
    const stored = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!stored) {
      return {
        snapshots: [],
        currentHash: CHAIN_SEED,
        chainIntegrity: true,
      };
    }
    
    const chain: SnapshotChain = JSON.parse(stored);
    
    // Verify chain integrity
    chain.chainIntegrity = verifyChainIntegrity(chain.snapshots);
    
    return chain;
  } catch (error) {
    console.error('[SNAPSHOT] Failed to load snapshot chain:', error);
    return {
      snapshots: [],
      currentHash: CHAIN_SEED,
      chainIntegrity: false,
    };
  }
}

/**
 * Saves the snapshot chain to storage
 */
function saveSnapshotChain(chain: SnapshotChain): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(chain));
  } catch (error) {
    console.error('[SNAPSHOT] Failed to save snapshot chain:', error);
  }
}

// ============================================================================
// CHAIN VERIFICATION
// ============================================================================

/**
 * Verifies the integrity of the snapshot chain
 */
function verifyChainIntegrity(snapshots: Snapshot[]): boolean {
  if (snapshots.length === 0) {
    return true;
  }
  
  let previousHash: string | null = null;
  
  for (const snapshot of snapshots) {
    // Verify manifest hash
    const computedHash = hashManifest(snapshot.manifest);
    if (computedHash !== snapshot.hash) {
      console.error(`[SNAPSHOT] Hash mismatch for snapshot ${snapshot.id}`);
      return false;
    }
    
    // Verify chain hash
    const computedChainHash = generateChainHash(previousHash, snapshot.hash);
    if (computedChainHash !== snapshot.chainHash) {
      console.error(`[SNAPSHOT] Chain hash mismatch for snapshot ${snapshot.id}`);
      return false;
    }
    
    // Verify previous hash link
    if (snapshot.previousHash !== previousHash) {
      console.error(`[SNAPSHOT] Previous hash mismatch for snapshot ${snapshot.id}`);
      return false;
    }
    
    previousHash = snapshot.hash;
  }
  
  return true;
}

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

/**
 * Creates an immutable snapshot of the current state
 */
export function createSnapshot(
  manifest: ProjectManifest,
  mode: 'development' | 'production',
  enforcementPassed: boolean
): Snapshot {
  const chain = loadSnapshotChain();
  
  // Generate snapshot ID
  const id = `snapshot-${Date.now()}-${sha256Hex(String(Math.random())).slice(0, 8)}`;
  
  // Generate hashes
  const hash = hashManifest(manifest);
  const previousHash = chain.snapshots.length > 0 
    ? chain.snapshots[chain.snapshots.length - 1].hash 
    : null;
  const chainHash = generateChainHash(previousHash, hash);
  
  // Create snapshot
  const snapshot: Snapshot = {
    id,
    timestamp: Date.now(),
    manifest: JSON.parse(JSON.stringify(manifest)), // Deep clone
    hash,
    previousHash,
    chainHash,
    metadata: {
      version: '1.0.0',
      mode,
      enforcementPassed,
    },
  };
  
  // Add to chain
  chain.snapshots.push(snapshot);
  chain.currentHash = chainHash;
  
  // Trim old snapshots
  if (chain.snapshots.length > MAX_SNAPSHOTS) {
    chain.snapshots = chain.snapshots.slice(-MAX_SNAPSHOTS);
  }
  
  // Verify integrity
  chain.chainIntegrity = verifyChainIntegrity(chain.snapshots);
  
  // Save chain
  saveSnapshotChain(chain);
  
  import.meta.env?.DEV && console.log(`[SNAPSHOT] ✅ Created snapshot ${id} (hash: ${hash})`);
  
  return snapshot;
}

// ============================================================================
// CORRUPTION DETECTION
// ============================================================================

/**
 * Detects if the snapshot chain has been corrupted
 */
export function detectCorruption(): boolean {
  const chain = loadSnapshotChain();
  
  if (!chain.chainIntegrity) {
    console.error('[SNAPSHOT] ❌ Corruption detected in snapshot chain');
    return true;
  }
  
  import.meta.env?.DEV && console.log('[SNAPSHOT] ✅ No corruption detected');
  return false;
}

// ============================================================================
// ROLLBACK
// ============================================================================

/**
 * Rolls back to the last valid snapshot
 */
export function rollbackToLastValid(): RollbackResult {
  const chain = loadSnapshotChain();
  
  if (chain.snapshots.length === 0) {
    return {
      success: false,
      snapshotId: '',
      timestamp: Date.now(),
      message: 'No snapshots available for rollback',
    };
  }
  
  // Find the last valid snapshot
  let lastValidSnapshot: Snapshot | null = null;
  
  for (let i = chain.snapshots.length - 1; i >= 0; i--) {
    const snapshot = chain.snapshots[i];
    
    // Verify this snapshot
    const computedHash = hashManifest(snapshot.manifest);
    if (computedHash === snapshot.hash && snapshot.metadata.enforcementPassed) {
      lastValidSnapshot = snapshot;
      break;
    }
  }
  
  if (!lastValidSnapshot) {
    return {
      success: false,
      snapshotId: '',
      timestamp: Date.now(),
      message: 'No valid snapshots found for rollback',
    };
  }
  
  import.meta.env?.DEV && console.log(`[SNAPSHOT] 🔄 Rolling back to snapshot ${lastValidSnapshot.id}`);
  
  return {
    success: true,
    snapshotId: lastValidSnapshot.id,
    timestamp: Date.now(),
    message: `Rolled back to snapshot ${lastValidSnapshot.id} from ${new Date(lastValidSnapshot.timestamp).toISOString()}`,
  };
}

/**
 * Rolls back to a specific snapshot by ID
 */
export function rollbackToSnapshot(snapshotId: string): RollbackResult {
  const chain = loadSnapshotChain();
  
  const snapshot = chain.snapshots.find(s => s.id === snapshotId);
  
  if (!snapshot) {
    return {
      success: false,
      snapshotId,
      timestamp: Date.now(),
      message: `Snapshot ${snapshotId} not found`,
    };
  }
  
  // Verify snapshot integrity
  const computedHash = hashManifest(snapshot.manifest);
  if (computedHash !== snapshot.hash) {
    return {
      success: false,
      snapshotId,
      timestamp: Date.now(),
      message: `Snapshot ${snapshotId} is corrupted`,
    };
  }
  
  import.meta.env?.DEV && console.log(`[SNAPSHOT] 🔄 Rolling back to snapshot ${snapshotId}`);
  
  return {
    success: true,
    snapshotId,
    timestamp: Date.now(),
    message: `Rolled back to snapshot ${snapshotId} from ${new Date(snapshot.timestamp).toISOString()}`,
  };
}

// ============================================================================
// SNAPSHOT QUERIES
// ============================================================================

/**
 * Gets all snapshots
 */
export function getAllSnapshots(): Snapshot[] {
  const chain = loadSnapshotChain();
  return [...chain.snapshots];
}

/**
 * Gets a specific snapshot by ID
 */
export function getSnapshot(snapshotId: string): Snapshot | null {
  const chain = loadSnapshotChain();
  return chain.snapshots.find(s => s.id === snapshotId) || null;
}

/**
 * Gets the latest snapshot
 */
export function getLatestSnapshot(): Snapshot | null {
  const chain = loadSnapshotChain();
  return chain.snapshots.length > 0 
    ? chain.snapshots[chain.snapshots.length - 1] 
    : null;
}

/**
 * Gets the snapshot chain status
 */
export function getChainStatus(): {
  snapshotCount: number;
  chainIntegrity: boolean;
  latestHash: string;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  const chain = loadSnapshotChain();
  
  return {
    snapshotCount: chain.snapshots.length,
    chainIntegrity: chain.chainIntegrity,
    latestHash: chain.currentHash,
    oldestTimestamp: chain.snapshots.length > 0 ? chain.snapshots[0].timestamp : null,
    newestTimestamp: chain.snapshots.length > 0 ? chain.snapshots[chain.snapshots.length - 1].timestamp : null,
  };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clears all snapshots (use with caution)
 */
export function clearAllSnapshots(): void {
  localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
  import.meta.env?.DEV && console.log('[SNAPSHOT] 🗑️ All snapshots cleared');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createSnapshot,
  detectCorruption,
  rollbackToLastValid,
  rollbackToSnapshot,
  getAllSnapshots,
  getSnapshot,
  getLatestSnapshot,
  getChainStatus,
  clearAllSnapshots,
};
