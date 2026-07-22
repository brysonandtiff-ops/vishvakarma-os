/**
 * Multi-User Governance Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MultiUserGovernance,
  getMultiUserGovernance,
  logMultiUserOperation,
  detectOperationConflicts,
  applyMultiUserOperation,
  type MultiUserOperation,
} from '@/modules/multiUserGovernance';

describe('MultiUserGovernance', () => {
  let governance: MultiUserGovernance;

  beforeEach(() => {
    MultiUserGovernance.resetInstance();
    governance = getMultiUserGovernance();
    localStorage.clear();
  });

  describe('Operation Logging', () => {
    it('should log multi-user operation', () => {
      const op = governance.logOperation(
        'user-1',
        'Alice',
        'add-wall',
        'wall-1',
        'wall',
        { x: 0, y: 0 }
      );

      expect(op.userId).toBe('user-1');
      expect(op.userName).toBe('Alice');
      expect(op.operation).toBe('add-wall');
      expect(op.elementId).toBe('wall-1');
      expect(op.applied).toBe(false);
    });

    it('should mark operation as applied', () => {
      const op = governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});

      governance.markOperationApplied(op.id);

      const recentOps = governance.getRecentOperations();
      expect(recentOps[0].applied).toBe(true);
    });

    it('should limit number of stored operations', () => {
      // Log more than max operations
      for (let i = 0; i < 1100; i++) {
        governance.logOperation('user-1', 'Alice', 'add-wall', `wall-${i}`, 'wall', {});
      }

      const recentOps = governance.getRecentOperations(2000);
      expect(recentOps.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect concurrent edit conflict', () => {
      const op1 = governance.logOperation(
        'user-1',
        'Alice',
        'update-wall',
        'wall-1',
        'wall',
        { x: 100 }
      );

      const op2 = governance.logOperation(
        'user-2',
        'Bob',
        'update-wall',
        'wall-1',
        'wall',
        { x: 200 }
      );

      const result = governance.detectConflicts(op2);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('concurrent-edit');
    });

    it('should detect deleted element conflict', () => {
      const op1 = governance.logOperation(
        'user-1',
        'Alice',
        'remove-wall',
        'wall-1',
        'wall',
        {}
      );

      const op2 = governance.logOperation(
        'user-2',
        'Bob',
        'update-wall',
        'wall-1',
        'wall',
        { x: 200 }
      );

      const result = governance.detectConflicts(op2);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('deleted-element');
    });

    it('should not detect conflict for different elements', () => {
      const op1 = governance.logOperation(
        'user-1',
        'Alice',
        'update-wall',
        'wall-1',
        'wall',
        { x: 100 }
      );

      const op2 = governance.logOperation(
        'user-2',
        'Bob',
        'update-wall',
        'wall-2',
        'wall',
        { x: 200 }
      );

      const result = governance.detectConflicts(op2);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should not detect conflict outside time window', () => {
      const op1 = governance.logOperation(
        'user-1',
        'Alice',
        'update-wall',
        'wall-1',
        'wall',
        { x: 100 }
      );

      // Manually set timestamp to be outside time window
      op1.timestamp = Date.now() - 10000; // 10 seconds ago

      const op2 = governance.logOperation(
        'user-2',
        'Bob',
        'update-wall',
        'wall-1',
        'wall',
        { x: 200 }
      );

      const result = governance.detectConflicts(op2, 5000); // 5 second window

      expect(result.hasConflict).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflict with last-write-wins', () => {
      governance.setMergeStrategy({ type: 'last-write-wins', priority: 'timestamp' });

      const op1: MultiUserOperation = {
        id: 'op-1',
        userId: 'user-1',
        userName: 'Alice',
        operation: 'update-wall',
        elementId: 'wall-1',
        elementType: 'wall',
        timestamp: Date.now() - 1000,
        payload: { x: 100 },
        applied: false,
      };

      const op2: MultiUserOperation = {
        id: 'op-2',
        userId: 'user-2',
        userName: 'Bob',
        operation: 'update-wall',
        elementId: 'wall-1',
        elementType: 'wall',
        timestamp: Date.now(),
        payload: { x: 200 },
        applied: false,
      };

      const resolved = governance.resolveConflict({
        type: 'concurrent-edit',
        elementId: 'wall-1',
        elementType: 'wall',
        operation1: op1,
        operation2: op2,
        description: 'Concurrent edit',
      });

      expect(resolved.id).toBe('op-2'); // Last write wins
    });

    it('should resolve conflict with first-write-wins', () => {
      governance.setMergeStrategy({ type: 'first-write-wins' });

      const op1: MultiUserOperation = {
        id: 'op-1',
        userId: 'user-1',
        userName: 'Alice',
        operation: 'update-wall',
        elementId: 'wall-1',
        elementType: 'wall',
        timestamp: Date.now() - 1000,
        payload: { x: 100 },
        applied: false,
      };

      const op2: MultiUserOperation = {
        id: 'op-2',
        userId: 'user-2',
        userName: 'Bob',
        operation: 'update-wall',
        elementId: 'wall-1',
        elementType: 'wall',
        timestamp: Date.now(),
        payload: { x: 200 },
        applied: false,
      };

      const resolved = governance.resolveConflict({
        type: 'concurrent-edit',
        elementId: 'wall-1',
        elementType: 'wall',
        operation1: op1,
        operation2: op2,
        description: 'Concurrent edit',
      });

      expect(resolved.id).toBe('op-1'); // First write wins
    });
  });

  describe('Operation Application', () => {
    it('should apply operation without conflicts', () => {
      const op = governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});

      const result = governance.applyOperation(op);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should apply operation with conflict resolution', () => {
      const op1 = governance.logOperation(
        'user-1',
        'Alice',
        'update-wall',
        'wall-1',
        'wall',
        { x: 100 }
      );

      const op2 = governance.logOperation(
        'user-2',
        'Bob',
        'update-wall',
        'wall-1',
        'wall',
        { x: 200 }
      );

      const result = governance.applyOperation(op2);

      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.resolvedOperation).toBeTruthy();
    });
  });

  describe('Operation Queries', () => {
    it('should get operations for element', () => {
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-2', 'Bob', 'update-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-2', 'wall', {});

      const ops = governance.getElementOperations('wall-1', 'wall');

      expect(ops).toHaveLength(2);
    });

    it('should get operations by user', () => {
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-2', 'Bob', 'add-wall', 'wall-2', 'wall', {});
      governance.logOperation('user-1', 'Alice', 'add-opening', 'opening-1', 'opening', {});

      const ops = governance.getUserOperations('user-1');

      expect(ops).toHaveLength(2);
    });

    it('should get recent operations', () => {
      for (let i = 0; i < 100; i++) {
        governance.logOperation('user-1', 'Alice', 'add-wall', `wall-${i}`, 'wall', {});
      }

      const ops = governance.getRecentOperations(10);

      expect(ops).toHaveLength(10);
    });
  });

  describe('Coordinated Undo/Redo', () => {
    it('should coordinate undo', () => {
      const op = governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.markOperationApplied(op.id);

      const result = governance.coordinateUndo('user-1');

      expect(result.success).toBe(true);
      expect(result.operation?.id).toBe(op.id);
      expect(result.operation?.applied).toBe(false);
    });

    it('should fail undo if no operations', () => {
      const result = governance.coordinateUndo('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No operations to undo');
    });

    it('should coordinate redo', () => {
      const op = governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      // Operation is not applied by default

      const result = governance.coordinateRedo('user-1');

      expect(result.success).toBe(true);
      expect(result.operation?.id).toBe(op.id);
      expect(result.operation?.applied).toBe(true);
    });

    it('should fail redo if no operations', () => {
      const result = governance.coordinateRedo('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No operations to redo');
    });

    it('should fail redo if conflicts detected', () => {
      const op1 = governance.logOperation('user-1', 'Alice', 'update-wall', 'wall-1', 'wall', {});
      const op2 = governance.logOperation('user-2', 'Bob', 'update-wall', 'wall-1', 'wall', {});
      governance.markOperationApplied(op2.id);

      const result = governance.coordinateRedo('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('conflicts detected');
    });
  });

  describe('Statistics', () => {
    it('should get operation statistics', () => {
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-2', 'Bob', 'add-wall', 'wall-2', 'wall', {});
      governance.logOperation('user-1', 'Alice', 'update-wall', 'wall-1', 'wall', {});

      const stats = governance.getStatistics();

      expect(stats.totalOperations).toBe(3);
      expect(stats.userCount).toBe(2);
    });
  });

  describe('Merge Strategy', () => {
    it('should set merge strategy', () => {
      governance.setMergeStrategy({ type: 'first-write-wins' });

      const strategy = governance.getMergeStrategy();

      expect(strategy.type).toBe('first-write-wins');
    });
  });

  describe('Operations Management', () => {
    it('should clear all operations', () => {
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-2', 'Bob', 'add-wall', 'wall-2', 'wall', {});

      governance.clearOperations();

      const stats = governance.getStatistics();
      expect(stats.totalOperations).toBe(0);
    });

    it('should export operations', () => {
      governance.logOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});
      governance.logOperation('user-2', 'Bob', 'add-wall', 'wall-2', 'wall', {});

      const exported = governance.exportOperations();

      expect(exported).toHaveLength(2);
    });
  });

  describe('Convenience Functions', () => {
    it('should log operation using convenience function', () => {
      const op = logMultiUserOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});

      expect(op.userId).toBe('user-1');
    });

    it('should detect conflicts using convenience function', () => {
      const op1 = logMultiUserOperation('user-1', 'Alice', 'update-wall', 'wall-1', 'wall', {});
      const op2 = logMultiUserOperation('user-2', 'Bob', 'update-wall', 'wall-1', 'wall', {});

      const result = detectOperationConflicts(op2);

      expect(result.hasConflict).toBe(true);
    });

    it('should apply operation using convenience function', () => {
      const op = logMultiUserOperation('user-1', 'Alice', 'add-wall', 'wall-1', 'wall', {});

      const result = applyMultiUserOperation(op);

      expect(result.success).toBe(true);
    });
  });
});
