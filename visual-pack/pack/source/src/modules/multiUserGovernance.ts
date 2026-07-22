/**
 * Multi-User Governance Module
 *
 * Audit logging for multi-user collaboration sessions.
 * Conflict resolution is handled by the Yjs CRDT layer — LWW merge paths are deprecated.
 */

import type { ProjectManifest } from '@/types';
import { broadcastOperation } from './collaborationEngine';
import { ElementLockingSystem } from './elementLock';
import { logGovernanceEvent } from './governanceLock';

export interface MultiUserOperation {
  id: string;
  userId: string;
  userName: string;
  operation: string;
  elementId?: string;
  elementType?: 'wall' | 'opening' | 'room' | 'window' | 'roof' | 'annotation';
  timestamp: number;
  payload: unknown;
  applied: boolean;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: Conflict[];
}

export interface Conflict {
  type: 'concurrent-edit' | 'deleted-element' | 'duplicate-id';
  elementId: string;
  elementType: 'wall' | 'opening' | 'room' | 'window' | 'roof' | 'annotation';
  operation1: MultiUserOperation;
  operation2: MultiUserOperation;
  description: string;
}

export interface MergeStrategy {
  type: 'last-write-wins' | 'first-write-wins' | 'manual';
  priority?: 'user' | 'timestamp';
}

/**
 * Multi-User Governance Class
 */
export class MultiUserGovernance {
  private static instance: MultiUserGovernance | null = null;
  private operations: MultiUserOperation[] = [];
  private maxOperations = 1000;
  private mergeStrategy: MergeStrategy = { type: 'last-write-wins', priority: 'timestamp' };

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MultiUserGovernance {
    if (!this.instance) {
      this.instance = new MultiUserGovernance();
    }
    return this.instance;
  }

  /**
   * Log multi-user operation
   */
  logOperation(
    userId: string,
    userName: string,
    operation: string,
    elementId: string | undefined,
    elementType: 'wall' | 'opening' | undefined,
    payload: unknown
  ): MultiUserOperation {
    const op: MultiUserOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      operation,
      elementId,
      elementType,
      timestamp: Date.now(),
      payload,
      applied: false,
    };

    this.operations.push(op);

    // Keep only last N operations
    if (this.operations.length > this.maxOperations) {
      this.operations = this.operations.slice(-this.maxOperations);
    }

    // Log to governance system
    logGovernanceEvent({
      type: 'multi-user-operation',
      metadata: {
        userId,
        userName,
        operation,
        elementId,
        elementType,
      },
      timestamp: Date.now(),
    });

    return op;
  }

  /**
   * Mark operation as applied
   */
  markOperationApplied(operationId: string): void {
    const op = this.operations.find(o => o.id === operationId);
    if (op) {
      op.applied = true;
    }
  }

  /**
   * Detect conflicts between operations
   */
  detectConflicts(
    operation: MultiUserOperation,
    timeWindow = 5000 // 5 seconds
  ): ConflictDetectionResult {
    const conflicts: Conflict[] = [];

    // Find recent operations on the same element
    const recentOps = this.operations.filter(
      op =>
        op.id !== operation.id &&
        op.elementId === operation.elementId &&
        op.elementType === operation.elementType &&
        Math.abs(op.timestamp - operation.timestamp) < timeWindow
    );

    for (const recentOp of recentOps) {
      // Check for concurrent edits
      if (
        (operation.operation === 'update-wall' || operation.operation === 'update-opening') &&
        (recentOp.operation === 'update-wall' || recentOp.operation === 'update-opening')
      ) {
        conflicts.push({
          type: 'concurrent-edit',
          elementId: operation.elementId!,
          elementType: operation.elementType!,
          operation1: recentOp,
          operation2: operation,
          description: `${recentOp.userName} and ${operation.userName} edited the same element concurrently`,
        });
      }

      // Check for deleted element
      if (
        (operation.operation === 'update-wall' || operation.operation === 'update-opening') &&
        (recentOp.operation === 'remove-wall' || recentOp.operation === 'remove-opening')
      ) {
        conflicts.push({
          type: 'deleted-element',
          elementId: operation.elementId!,
          elementType: operation.elementType!,
          operation1: recentOp,
          operation2: operation,
          description: `${operation.userName} tried to edit element that ${recentOp.userName} deleted`,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * @deprecated CRDT layer converges edits; retained for audit compatibility only.
   */
  resolveConflict(conflict: Conflict): MultiUserOperation {
    console.warn('[multiUserGovernance] LWW conflict resolution is deprecated; CRDT handles merge.', conflict.type);
    const { operation1, operation2 } = conflict;
    const first = operation1.timestamp <= operation2.timestamp ? operation1 : operation2;
    const last = operation1.timestamp >= operation2.timestamp ? operation1 : operation2;

    if (this.mergeStrategy.type === 'first-write-wins') {
      return first;
    }

    return last;
  }

  /**
   * Log operation application. Structural conflicts are resolved by Yjs, not LWW.
   */
  applyOperation(operation: MultiUserOperation): {
    success: boolean;
    conflicts: Conflict[];
    resolvedOperation?: MultiUserOperation;
  } {
    const conflictResult = this.detectConflicts(operation);
    this.markOperationApplied(operation.id);

    if (conflictResult.hasConflict) {
      logGovernanceEvent({
        type: 'crdt-conflict-audit',
        metadata: {
          elementId: operation.elementId,
          elementType: operation.elementType,
          conflictCount: conflictResult.conflicts.length,
        },
        timestamp: Date.now(),
      });
    }

    return {
      success: true,
      conflicts: conflictResult.conflicts,
      resolvedOperation: operation,
    };
  }

  /**
   * Get operations for element
   */
  getElementOperations(
    elementId: string,
    elementType: 'wall' | 'opening'
  ): MultiUserOperation[] {
    return this.operations.filter(
      op => op.elementId === elementId && op.elementType === elementType
    );
  }

  /**
   * Get operations by user
   */
  getUserOperations(userId: string): MultiUserOperation[] {
    return this.operations.filter(op => op.userId === userId);
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit = 50): MultiUserOperation[] {
    return this.operations.slice(-limit);
  }

  /**
   * Set merge strategy
   */
  setMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategy = strategy;

    logGovernanceEvent({
      type: 'merge-strategy-changed',
      metadata: { strategy },
      timestamp: Date.now(),
    });
  }

  /**
   * Get merge strategy
   */
  getMergeStrategy(): MergeStrategy {
    return this.mergeStrategy;
  }

  /**
   * Coordinate undo operation in multi-user context
   */
  coordinateUndo(userId: string): {
    success: boolean;
    operation?: MultiUserOperation;
    error?: string;
  } {
    // Find last applied operation by user
    const userOps = this.operations
      .filter(op => op.userId === userId && op.applied)
      .reverse();

    if (userOps.length === 0) {
      return {
        success: false,
        error: 'No operations to undo',
      };
    }

    const lastOp = userOps[0];

    if (lastOp.elementId && lastOp.elementType) {
      const locking = ElementLockingSystem.getInstance();
      const lock = locking.getLock(lastOp.elementId, lastOp.elementType);
      if (lock && lock.userId !== userId) {
        return {
          success: false,
          error: `Element is locked by ${lock.userName}`,
        };
      }
    }

    // Mark operation as unapplied
    lastOp.applied = false;

    broadcastOperation('undo', lastOp.elementId, lastOp.elementType, {
      operationId: lastOp.id,
      userId,
    });

    logGovernanceEvent({
      type: 'multi-user-undo',
      metadata: {
        userId,
        operationId: lastOp.id,
        operation: lastOp.operation,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      operation: lastOp,
    };
  }

  /**
   * Coordinate redo operation in multi-user context
   */
  coordinateRedo(userId: string): {
    success: boolean;
    operation?: MultiUserOperation;
    error?: string;
  } {
    // Find last unapplied operation by user
    const userOps = this.operations
      .filter(op => op.userId === userId && !op.applied)
      .reverse();

    if (userOps.length === 0) {
      return {
        success: false,
        error: 'No operations to redo',
      };
    }

    const lastOp = userOps[0];

    // Check for conflicts
    const conflictResult = this.detectConflicts(lastOp);

    if (conflictResult.hasConflict) {
      return {
        success: false,
        error: 'Cannot redo: conflicts detected',
      };
    }

    // Mark operation as applied
    lastOp.applied = true;

    logGovernanceEvent({
      type: 'multi-user-redo',
      metadata: {
        userId,
        operationId: lastOp.id,
        operation: lastOp.operation,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      operation: lastOp,
    };
  }

  /**
   * Get operation statistics
   */
  getStatistics(): {
    totalOperations: number;
    appliedOperations: number;
    conflictCount: number;
    userCount: number;
  } {
    const uniqueUsers = new Set(this.operations.map(op => op.userId));
    const appliedOps = this.operations.filter(op => op.applied);

    // Count conflicts (simplified)
    let conflictCount = 0;
    for (const op of this.operations) {
      const result = this.detectConflicts(op);
      if (result.hasConflict) {
        conflictCount += result.conflicts.length;
      }
    }

    return {
      totalOperations: this.operations.length,
      appliedOperations: appliedOps.length,
      conflictCount,
      userCount: uniqueUsers.size,
    };
  }

  /**
   * Clear all operations
   */
  clearOperations(): void {
    this.operations = [];

    logGovernanceEvent({
      type: 'multi-user-operations-cleared',
      timestamp: Date.now(),
    });
  }

  /**
   * Export operations for debugging
   */
  exportOperations(): MultiUserOperation[] {
    return [...this.operations];
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (this.instance) {
      this.instance.clearOperations();
      this.instance = null;
    }
  }
}

/**
 * Convenience functions
 */
export function getMultiUserGovernance(): MultiUserGovernance {
  return MultiUserGovernance.getInstance();
}

export function logMultiUserOperation(
  userId: string,
  userName: string,
  operation: string,
  elementId?: string,
  elementType?: 'wall' | 'opening',
  payload?: unknown
): MultiUserOperation {
  const governance = getMultiUserGovernance();
  return governance.logOperation(userId, userName, operation, elementId, elementType, payload);
}

export function detectOperationConflicts(
  operation: MultiUserOperation
): ConflictDetectionResult {
  const governance = getMultiUserGovernance();
  return governance.detectConflicts(operation);
}

export function applyMultiUserOperation(operation: MultiUserOperation): {
  success: boolean;
  conflicts: Conflict[];
  resolvedOperation?: MultiUserOperation;
} {
  const governance = getMultiUserGovernance();
  return governance.applyOperation(operation);
}
