/**
 * Element Locking System Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ElementLockingSystem,
  getLockingSystem,
  acquireElementLock,
  releaseElementLock,
  isElementLocked,
  getElementLock,
} from '@/modules/elementLock';

describe('ElementLockingSystem', () => {
  let system: ElementLockingSystem;

  beforeEach(() => {
    ElementLockingSystem.resetInstance();
    system = getLockingSystem();
  });

  describe('Lock Acquisition', () => {
    it('should acquire lock on element', () => {
      const result = system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(result.success).toBe(true);
      expect(result.lock).toBeTruthy();
      expect(result.lock?.elementId).toBe('wall-1');
      expect(result.lock?.userId).toBe('user-1');
    });

    it('should fail to acquire lock if already locked by another user', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const result = system.acquireLock('wall-1', 'wall', 'user-2', 'Bob');

      expect(result.success).toBe(false);
      expect(result.error).toContain('locked by Alice');
      expect(result.conflictingUser).toBe('Alice');
    });

    it('should extend lock if user already owns it', () => {
      const result1 = system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const expiresAt1 = result1.lock!.expiresAt;

      // Wait a bit
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      const result2 = system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const expiresAt2 = result2.lock!.expiresAt;

      expect(result2.success).toBe(true);
      expect(expiresAt2).toBeGreaterThan(expiresAt1);

      vi.useRealTimers();
    });

    it('should acquire lock if previous lock expired', () => {
      system.setLockTimeout(1000); // 1 second
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      // Wait for lock to expire
      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      const result = system.acquireLock('wall-1', 'wall', 'user-2', 'Bob');

      expect(result.success).toBe(true);
      expect(result.lock?.userId).toBe('user-2');

      vi.useRealTimers();
    });
  });

  describe('Lock Release', () => {
    it('should release lock', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const released = system.releaseLock('wall-1', 'wall', 'user-1');

      expect(released).toBe(true);
      expect(system.isLocked('wall-1', 'wall')).toBe(false);
    });

    it('should not release lock if user does not own it', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const released = system.releaseLock('wall-1', 'wall', 'user-2');

      expect(released).toBe(false);
      expect(system.isLocked('wall-1', 'wall')).toBe(true);
    });

    it('should return false if no lock to release', () => {
      const released = system.releaseLock('wall-1', 'wall', 'user-1');

      expect(released).toBe(false);
    });
  });

  describe('Lock Status', () => {
    it('should check if element is locked', () => {
      expect(system.isLocked('wall-1', 'wall')).toBe(false);

      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(system.isLocked('wall-1', 'wall')).toBe(true);
    });

    it('should check if element is locked by specific user', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(system.isLockedBy('wall-1', 'wall', 'user-1')).toBe(true);
      expect(system.isLockedBy('wall-1', 'wall', 'user-2')).toBe(false);
    });

    it('should get lock for element', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      const lock = system.getLock('wall-1', 'wall');

      expect(lock).toBeTruthy();
      expect(lock?.elementId).toBe('wall-1');
      expect(lock?.userId).toBe('user-1');
    });

    it('should return null if element is not locked', () => {
      const lock = system.getLock('wall-1', 'wall');

      expect(lock).toBeNull();
    });
  });

  describe('User Locks', () => {
    it('should get all locks for a user', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      system.acquireLock('wall-2', 'wall', 'user-1', 'Alice');
      system.acquireLock('opening-1', 'opening', 'user-1', 'Alice');

      const locks = system.getUserLocks('user-1');

      expect(locks).toHaveLength(3);
    });

    it('should release all locks for a user', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      system.acquireLock('wall-2', 'wall', 'user-1', 'Alice');
      system.acquireLock('opening-1', 'opening', 'user-2', 'Bob');

      const count = system.releaseUserLocks('user-1');

      expect(count).toBe(2);
      expect(system.isLocked('wall-1', 'wall')).toBe(false);
      expect(system.isLocked('wall-2', 'wall')).toBe(false);
      expect(system.isLocked('opening-1', 'opening')).toBe(true);
    });
  });

  describe('All Locks', () => {
    it('should get all active locks', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      system.acquireLock('wall-2', 'wall', 'user-2', 'Bob');

      const locks = system.getAllLocks();

      expect(locks).toHaveLength(2);
    });

    it('should clear all locks', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      system.acquireLock('wall-2', 'wall', 'user-2', 'Bob');

      system.clearAllLocks();

      expect(system.getAllLocks()).toHaveLength(0);
    });
  });

  describe('Lock Extension', () => {
    it('should extend lock timeout', () => {
      const result = system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const expiresAt1 = result.lock!.expiresAt;

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      const extended = system.extendLock('wall-1', 'wall', 'user-1');
      const lock = system.getLock('wall-1', 'wall');
      const expiresAt2 = lock!.expiresAt;

      expect(extended).toBe(true);
      expect(expiresAt2).toBeGreaterThan(expiresAt1);

      vi.useRealTimers();
    });

    it('should not extend lock if user does not own it', () => {
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      const extended = system.extendLock('wall-1', 'wall', 'user-2');

      expect(extended).toBe(false);
    });
  });

  describe('Lock Timeout', () => {
    it('should set lock timeout', () => {
      system.setLockTimeout(60000);

      expect(system.getLockTimeout()).toBe(60000);
    });

    it('should use custom timeout for new locks', () => {
      system.setLockTimeout(5000);

      const result = system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');
      const lock = result.lock!;

      expect(lock.expiresAt - lock.acquiredAt).toBe(5000);
    });
  });

  describe('Lock Expiration', () => {
    it('should expire locks after timeout', () => {
      system.setLockTimeout(1000);
      system.acquireLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(system.isLocked('wall-1', 'wall')).toBe(true);

      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      expect(system.isLocked('wall-1', 'wall')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Convenience Functions', () => {
    it('should acquire lock using convenience function', () => {
      const result = acquireElementLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(result.success).toBe(true);
    });

    it('should release lock using convenience function', () => {
      acquireElementLock('wall-1', 'wall', 'user-1', 'Alice');
      const released = releaseElementLock('wall-1', 'wall', 'user-1');

      expect(released).toBe(true);
    });

    it('should check lock status using convenience function', () => {
      acquireElementLock('wall-1', 'wall', 'user-1', 'Alice');

      expect(isElementLocked('wall-1', 'wall')).toBe(true);
    });

    it('should get lock using convenience function', () => {
      acquireElementLock('wall-1', 'wall', 'user-1', 'Alice');

      const lock = getElementLock('wall-1', 'wall');

      expect(lock).toBeTruthy();
      expect(lock?.userId).toBe('user-1');
    });
  });
});
