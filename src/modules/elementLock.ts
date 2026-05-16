/**
 * Element Locking System Module
 * 
 * Implements lock-on-edit system to prevent concurrent modifications.
 * Handles lock acquisition, release, timeout, and conflict resolution.
 * 
 * Part of STEP 8 - Collaboration & Multi-User Editing
 */

export interface ElementLock {
  elementId: string;
  elementType: 'wall' | 'opening';
  userId: string;
  userName: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface LockResult {
  success: boolean;
  lock?: ElementLock;
  error?: string;
  conflictingUser?: string;
}

/**
 * Element Locking System Class
 */
export class ElementLockingSystem {
  private static instance: ElementLockingSystem | null = null;
  private locks: Map<string, ElementLock> = new Map();
  private lockTimeout = 30000; // 30 seconds default
  private cleanupInterval: number | null = null;

  private constructor() {
    this.startCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ElementLockingSystem {
    if (!this.instance) {
      this.instance = new ElementLockingSystem();
    }
    return this.instance;
  }

  /**
   * Acquire lock on element
   */
  acquireLock(
    elementId: string,
    elementType: 'wall' | 'opening',
    userId: string,
    userName: string
  ): LockResult {
    const lockKey = this.getLockKey(elementId, elementType);
    const existingLock = this.locks.get(lockKey);

    // Check if element is already locked
    if (existingLock) {
      // Check if lock has expired
      if (Date.now() > existingLock.expiresAt) {
        // Lock expired, remove it
        this.locks.delete(lockKey);
      } else if (existingLock.userId === userId) {
        // User already owns the lock, extend it
        existingLock.expiresAt = Date.now() + this.lockTimeout;
        return {
          success: true,
          lock: existingLock,
        };
      } else {
        // Lock is held by another user
        return {
          success: false,
          error: `Element is locked by ${existingLock.userName}`,
          conflictingUser: existingLock.userName,
        };
      }
    }

    // Create new lock
    const lock: ElementLock = {
      elementId,
      elementType,
      userId,
      userName,
      acquiredAt: Date.now(),
      expiresAt: Date.now() + this.lockTimeout,
    };

    this.locks.set(lockKey, lock);

    return {
      success: true,
      lock,
    };
  }

  /**
   * Release lock on element
   */
  releaseLock(
    elementId: string,
    elementType: 'wall' | 'opening',
    userId: string
  ): boolean {
    const lockKey = this.getLockKey(elementId, elementType);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return false; // No lock to release
    }

    if (lock.userId !== userId) {
      return false; // User doesn't own the lock
    }

    this.locks.delete(lockKey);
    return true;
  }

  /**
   * Check if element is locked
   */
  isLocked(elementId: string, elementType: 'wall' | 'opening'): boolean {
    const lockKey = this.getLockKey(elementId, elementType);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return false;
    }

    // Check if lock has expired
    if (Date.now() > lock.expiresAt) {
      this.locks.delete(lockKey);
      return false;
    }

    return true;
  }

  /**
   * Check if element is locked by specific user
   */
  isLockedBy(
    elementId: string,
    elementType: 'wall' | 'opening',
    userId: string
  ): boolean {
    const lockKey = this.getLockKey(elementId, elementType);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return false;
    }

    // Check if lock has expired
    if (Date.now() > lock.expiresAt) {
      this.locks.delete(lockKey);
      return false;
    }

    return lock.userId === userId;
  }

  /**
   * Get lock for element
   */
  getLock(elementId: string, elementType: 'wall' | 'opening'): ElementLock | null {
    const lockKey = this.getLockKey(elementId, elementType);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return null;
    }

    // Check if lock has expired
    if (Date.now() > lock.expiresAt) {
      this.locks.delete(lockKey);
      return null;
    }

    return lock;
  }

  /**
   * Get all locks for a user
   */
  getUserLocks(userId: string): ElementLock[] {
    const userLocks: ElementLock[] = [];

    this.locks.forEach(lock => {
      if (lock.userId === userId && Date.now() <= lock.expiresAt) {
        userLocks.push(lock);
      }
    });

    return userLocks;
  }

  /**
   * Get all active locks
   */
  getAllLocks(): ElementLock[] {
    const activeLocks: ElementLock[] = [];

    this.locks.forEach(lock => {
      if (Date.now() <= lock.expiresAt) {
        activeLocks.push(lock);
      }
    });

    return activeLocks;
  }

  /**
   * Release all locks for a user
   */
  releaseUserLocks(userId: string): number {
    let count = 0;

    this.locks.forEach((lock, key) => {
      if (lock.userId === userId) {
        this.locks.delete(key);
        count++;
      }
    });

    return count;
  }

  /**
   * Extend lock timeout
   */
  extendLock(
    elementId: string,
    elementType: 'wall' | 'opening',
    userId: string
  ): boolean {
    const lockKey = this.getLockKey(elementId, elementType);
    const lock = this.locks.get(lockKey);

    if (!lock || lock.userId !== userId) {
      return false;
    }

    lock.expiresAt = Date.now() + this.lockTimeout;
    return true;
  }

  /**
   * Set lock timeout duration
   */
  setLockTimeout(timeout: number): void {
    this.lockTimeout = timeout;
  }

  /**
   * Get lock timeout duration
   */
  getLockTimeout(): number {
    return this.lockTimeout;
  }

  /**
   * Clear all locks
   */
  clearAllLocks(): void {
    this.locks.clear();
  }

  /**
   * Get lock key
   */
  private getLockKey(elementId: string, elementType: 'wall' | 'opening'): string {
    return `${elementType}:${elementId}`;
  }

  /**
   * Start cleanup interval to remove expired locks
   */
  private startCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.locks.forEach((lock, key) => {
        if (now > lock.expiresAt) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => {
        this.locks.delete(key);
      });

      if (expiredKeys.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} expired locks`);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (this.instance) {
      this.instance.stopCleanup();
      this.instance.clearAllLocks();
      this.instance = null;
    }
  }
}

/**
 * Convenience functions
 */
export function getLockingSystem(): ElementLockingSystem {
  return ElementLockingSystem.getInstance();
}

export function acquireElementLock(
  elementId: string,
  elementType: 'wall' | 'opening',
  userId: string,
  userName: string
): LockResult {
  const system = getLockingSystem();
  return system.acquireLock(elementId, elementType, userId, userName);
}

export function releaseElementLock(
  elementId: string,
  elementType: 'wall' | 'opening',
  userId: string
): boolean {
  const system = getLockingSystem();
  return system.releaseLock(elementId, elementType, userId);
}

export function isElementLocked(
  elementId: string,
  elementType: 'wall' | 'opening'
): boolean {
  const system = getLockingSystem();
  return system.isLocked(elementId, elementType);
}

export function getElementLock(
  elementId: string,
  elementType: 'wall' | 'opening'
): ElementLock | null {
  const system = getLockingSystem();
  return system.getLock(elementId, elementType);
}
