/**
 * Canvas Engine Module
 * 
 * Unified coordination layer for all canvas operations.
 * Ensures all drawing, selection, and measurement operations
 * are validated and tracked through governance.
 * 
 * Part of STEP 6 - Final Canvas & Governance Lock
 */

import type { Wall, Opening, ToolType } from '@/types';
import { validateManifest } from '@/core/manifestSchema';
import { logGovernanceEvent } from './governanceLock';

export interface CanvasState {
  walls: Wall[];
  openings: Opening[];
  selectedWallId?: string;
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
}

export interface CanvasOperation {
  type: 'add-wall' | 'remove-wall' | 'add-opening' | 'remove-opening' | 'update-wall' | 'update-opening';
  payload: unknown;
  timestamp: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Canvas Engine Class
 * Coordinates all canvas operations with governance enforcement
 */
export class CanvasEngine {
  private state: CanvasState;
  private operationQueue: CanvasOperation[] = [];
  private locked = false;

  constructor(initialState: CanvasState) {
    this.state = initialState;
  }

  /**
   * Get current canvas state
   */
  getState(): CanvasState {
    return { ...this.state };
  }

  /**
   * Validate a canvas operation before execution
   */
  private validateOperation(operation: CanvasOperation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Simulate state after operation
    const simulatedState = this.simulateOperation(operation);

    // Validate against manifest schema
    try {
      validateManifest({
        version: '1.0.0',
        name: 'Validation',
        walls: simulatedState.walls,
        openings: simulatedState.openings,
        materials: [],
        floorMaterial: 'material-concrete',
        lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
        gridSize: 20,
        snapToGrid: true,
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      });
    } catch (error) {
      errors.push(`Manifest validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Additional canvas-specific validations
    if (operation.type === 'add-wall') {
      const wall = operation.payload as Wall;
      
      // Check for zero-length walls
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length < 1) {
        errors.push('Wall length must be at least 1 unit');
      }

      // Check for overlapping walls
      const overlapping = simulatedState.walls.some(w => 
        w.id !== wall.id && this.wallsOverlap(w, wall)
      );
      
      if (overlapping) {
        warnings.push('Wall overlaps with existing wall');
      }
    }

    if (operation.type === 'add-opening') {
      const opening = operation.payload as Opening;
      
      // Check if wall exists
      const wall = simulatedState.walls.find(w => w.id === opening.wallId);
      if (!wall) {
        errors.push(`Wall ${opening.wallId} not found for opening`);
      }

      // Check for overlapping openings on same wall
      const overlapping = simulatedState.openings.some(o => 
        o.id !== opening.id && 
        o.wallId === opening.wallId && 
        this.openingsOverlap(o, opening)
      );
      
      if (overlapping) {
        warnings.push('Opening overlaps with existing opening on same wall');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Simulate an operation to check its effects
   */
  private simulateOperation(operation: CanvasOperation): CanvasState {
    const simulated = { ...this.state };

    switch (operation.type) {
      case 'add-wall':
        simulated.walls = [...simulated.walls, operation.payload as Wall];
        break;
      case 'remove-wall': {
        const wallId = operation.payload as string;
        simulated.walls = simulated.walls.filter(w => w.id !== wallId);
        simulated.openings = simulated.openings.filter(o => o.wallId !== wallId);
        break;
      }
      case 'add-opening':
        simulated.openings = [...simulated.openings, operation.payload as Opening];
        break;
      case 'remove-opening': {
        const openingId = operation.payload as string;
        simulated.openings = simulated.openings.filter(o => o.id !== openingId);
        break;
      }
      case 'update-wall': {
        const wall = operation.payload as Wall;
        simulated.walls = simulated.walls.map(w => w.id === wall.id ? wall : w);
        break;
      }
      case 'update-opening': {
        const opening = operation.payload as Opening;
        simulated.openings = simulated.openings.map(o => o.id === opening.id ? opening : o);
        break;
      }
    }

    return simulated;
  }

  /**
   * Check if two walls overlap
   */
  private wallsOverlap(wall1: Wall, wall2: Wall): boolean {
    // Simple bounding box check
    const box1 = {
      minX: Math.min(wall1.start.x, wall1.end.x),
      maxX: Math.max(wall1.start.x, wall1.end.x),
      minY: Math.min(wall1.start.y, wall1.end.y),
      maxY: Math.max(wall1.start.y, wall1.end.y),
    };

    const box2 = {
      minX: Math.min(wall2.start.x, wall2.end.x),
      maxX: Math.max(wall2.start.x, wall2.end.x),
      minY: Math.min(wall2.start.y, wall2.end.y),
      maxY: Math.max(wall2.start.y, wall2.end.y),
    };

    return !(
      box1.maxX < box2.minX ||
      box1.minX > box2.maxX ||
      box1.maxY < box2.minY ||
      box1.minY > box2.maxY
    );
  }

  /**
   * Check if two openings overlap on the same wall
   */
  private openingsOverlap(opening1: Opening, opening2: Opening): boolean {
    const pos1 = opening1.position;
    const pos2 = opening2.position;
    const width1 = opening1.width / 100; // Convert cm to normalized units
    const width2 = opening2.width / 100;

    const start1 = pos1 - width1 / 2;
    const end1 = pos1 + width1 / 2;
    const start2 = pos2 - width2 / 2;
    const end2 = pos2 + width2 / 2;

    return !(end1 < start2 || start1 > end2);
  }

  /**
   * Execute a canvas operation with validation and governance tracking
   */
  async executeOperation(operation: CanvasOperation): Promise<ValidationResult> {
    if (this.locked) {
      return {
        valid: false,
        errors: ['Canvas is locked. Cannot execute operation.'],
        warnings: [],
      };
    }

    // Validate operation
    const validation = this.validateOperation(operation);

    if (!validation.valid) {
      // Log failed operation
      logGovernanceEvent({
        type: 'operation-rejected',
        operation: operation.type,
        reason: validation.errors.join(', '),
        timestamp: Date.now(),
      });

      return validation;
    }

    // Execute operation
    this.state = this.simulateOperation(operation);

    // Add to operation queue
    this.operationQueue.push(operation);

    // Log successful operation
    logGovernanceEvent({
      type: 'operation-executed',
      operation: operation.type,
      timestamp: Date.now(),
    });

    return validation;
  }

  /**
   * Add a wall to the canvas
   */
  async addWall(wall: Wall): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'add-wall',
      payload: wall,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a wall from the canvas
   */
  async removeWall(wallId: string): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'remove-wall',
      payload: wallId,
      timestamp: Date.now(),
    });
  }

  /**
   * Add an opening to the canvas
   */
  async addOpening(opening: Opening): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'add-opening',
      payload: opening,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove an opening from the canvas
   */
  async removeOpening(openingId: string): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'remove-opening',
      payload: openingId,
      timestamp: Date.now(),
    });
  }

  /**
   * Update a wall
   */
  async updateWall(wall: Wall): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'update-wall',
      payload: wall,
      timestamp: Date.now(),
    });
  }

  /**
   * Update an opening
   */
  async updateOpening(opening: Opening): Promise<ValidationResult> {
    return this.executeOperation({
      type: 'update-opening',
      payload: opening,
      timestamp: Date.now(),
    });
  }

  /**
   * Lock the canvas to prevent modifications
   */
  lock(): void {
    this.locked = true;
    logGovernanceEvent({
      type: 'canvas-locked',
      timestamp: Date.now(),
    });
  }

  /**
   * Unlock the canvas to allow modifications
   */
  unlock(): void {
    this.locked = false;
    logGovernanceEvent({
      type: 'canvas-unlocked',
      timestamp: Date.now(),
    });
  }

  /**
   * Check if canvas is locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get operation history
   */
  getOperationHistory(): CanvasOperation[] {
    return [...this.operationQueue];
  }

  /**
   * Clear operation history
   */
  clearOperationHistory(): void {
    this.operationQueue = [];
  }

  /**
   * Validate current canvas state
   */
  validateCurrentState(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned openings
    const wallIds = new Set(this.state.walls.map(w => w.id));
    const orphanedOpenings = this.state.openings.filter(o => !wallIds.has(o.wallId));
    
    if (orphanedOpenings.length > 0) {
      errors.push(`Found ${orphanedOpenings.length} orphaned openings without walls`);
    }

    // Check for duplicate IDs
    const wallIdSet = new Set<string>();
    for (const wall of this.state.walls) {
      if (wallIdSet.has(wall.id)) {
        errors.push(`Duplicate wall ID: ${wall.id}`);
      }
      wallIdSet.add(wall.id);
    }

    const openingIdSet = new Set<string>();
    for (const opening of this.state.openings) {
      if (openingIdSet.has(opening.id)) {
        errors.push(`Duplicate opening ID: ${opening.id}`);
      }
      openingIdSet.add(opening.id);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Create a new canvas engine instance
 */
export function createCanvasEngine(initialState: CanvasState): CanvasEngine {
  return new CanvasEngine(initialState);
}

/**
 * Singleton instance for global access
 */
let globalCanvasEngine: CanvasEngine | null = null;

/**
 * Initialize global canvas engine
 */
export function initializeCanvasEngine(initialState: CanvasState): CanvasEngine {
  globalCanvasEngine = createCanvasEngine(initialState);
  return globalCanvasEngine;
}

/**
 * Get global canvas engine instance
 */
export function getCanvasEngine(): CanvasEngine {
  if (!globalCanvasEngine) {
    throw new Error('Canvas engine not initialized. Call initializeCanvasEngine first.');
  }
  return globalCanvasEngine;
}
