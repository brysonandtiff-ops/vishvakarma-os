import {
  createEmptyProjectManifest,
  createProjectManifest,
  PROJECT_SPEC_VERSION,
} from '@/core/projectModel';
import { VersionControlHooks } from '@/modules/versionControlHooks';
import { calculateProjectCostItems } from '@/utils/costEstimate';
import { detectRoomAtPoint, detectRoomFromWalls } from '@/utils/roomCalculations';
import type {
  CostItem,
  DimensionAnnotation,
  FurnitureItem,
  Label,
  LandscapeElement,
  LightingConfig,
  MepSymbol,
  Opening,
  Point2D,
  ProjectManifest,
  Room,
  ToolType,
  Wall,
  WorkspaceMode,
} from '@/types';

export interface EditorSessionState {
  currentTool: ToolType;
  selectedWallId?: string;
  selectedOpeningId?: string;
  show3DView: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  workspaceMode: WorkspaceMode;
  zenMode: boolean;
  presentationLock: boolean;
  projectName: string;
  description?: string;
}

export interface FloorPlanSnapshot {
  manifest: ProjectManifest;
  session: EditorSessionState;
  canUndo: boolean;
  canRedo: boolean;
  revision: number;
}

const DEFAULT_SESSION: EditorSessionState = {
  currentTool: 'select',
  show3DView: false,
  gridVisible: true,
  snapEnabled: true,
  workspaceMode: 'draft',
  zenMode: false,
  presentationLock: false,
  projectName: 'Untitled Project',
};

export class FloorPlanEngine {
  private static instance: FloorPlanEngine | null = null;
  private manifest: ProjectManifest;
  private session: EditorSessionState;
  private versionControl: VersionControlHooks;
  private listeners = new Set<() => void>();
  private revision = 0;
  private skipVersionSnapshot = false;

  private constructor() {
    this.manifest = createEmptyProjectManifest('Untitled Project');
    this.session = { ...DEFAULT_SESSION };
    this.versionControl = new VersionControlHooks({
      autoSaveEnabled: false,
      autoSaveInterval: 30000,
      maxVersions: 50,
      persistToLocalStorage: false,
    });
    this.versionControl.initialize();
    this.versionControl.saveVersion(this.manifest, 'Initial', false);
    this.versionControl.updateCurrentManifest(this.manifest);
  }

  static getInstance(): FloorPlanEngine {
    if (!FloorPlanEngine.instance) {
      FloorPlanEngine.instance = new FloorPlanEngine();
    }
    return FloorPlanEngine.instance;
  }

  static resetInstance(): void {
    FloorPlanEngine.instance?.versionControl.cleanup();
    FloorPlanEngine.instance = null;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.revision += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }

  getSnapshot = (): FloorPlanSnapshot => ({
    manifest: this.manifest,
    session: this.session,
    canUndo: this.versionControl.canUndo(),
    canRedo: this.versionControl.canRedo(),
    revision: this.revision,
  });

  getManifest(): ProjectManifest {
    return this.manifest;
  }

  getSession(): EditorSessionState {
    return this.session;
  }

  getWalls(): Wall[] {
    return this.manifest.walls;
  }

  getOpenings(): Opening[] {
    return this.manifest.openings;
  }

  getLabels(): Label[] {
    return this.manifest.labels ?? [];
  }

  getDimensions(): DimensionAnnotation[] {
    return this.manifest.dimensions ?? [];
  }

  getRooms(): Room[] {
    return this.manifest.rooms ?? [];
  }

  getFurniture(): FurnitureItem[] {
    return this.manifest.furniture ?? [];
  }

  getMepSymbols(): MepSymbol[] {
    return this.manifest.mepSymbols ?? [];
  }

  getLandscapeElements(): LandscapeElement[] {
    return this.manifest.landscapeElements ?? [];
  }

  getCostItems(): CostItem[] {
    return this.manifest.costItems ?? [];
  }

  getNorthOrientation(): number {
    return this.manifest.northOrientation ?? 0;
  }

  getLighting(): LightingConfig {
    return this.manifest.lighting;
  }

  private touchManifest(partial: Partial<ProjectManifest>, snapshotLabel = 'Edit'): void {
    const nextManifest = {
      ...this.manifest,
      ...partial,
      metadata: {
        ...this.manifest.metadata,
        modified: new Date().toISOString(),
      },
    };

    if (!partial.costItems) {
      nextManifest.costItems = calculateProjectCostItems(nextManifest);
    }

    this.manifest = nextManifest;
    if (!this.skipVersionSnapshot) {
      this.versionControl.saveVersion(this.manifest, snapshotLabel);
      this.versionControl.updateCurrentManifest(this.manifest);
    }
    this.notify();
  }

  private touchSession(partial: Partial<EditorSessionState>): void {
    this.session = { ...this.session, ...partial };
    this.notify();
  }

  loadManifest(manifest: ProjectManifest, projectName?: string): void {
    this.skipVersionSnapshot = true;
    const normalized = {
      ...manifest,
      version: manifest.version || PROJECT_SPEC_VERSION,
      costItems: calculateProjectCostItems(manifest),
    };
    this.manifest = normalized;
    this.session = {
      ...this.session,
      projectName: projectName ?? manifest.name,
      description: manifest.description,
      snapEnabled: manifest.snapToGrid ?? true,
    };
    this.versionControl.clearVersionHistory();
    this.versionControl.saveVersion(this.manifest, 'Loaded', false);
    this.versionControl.updateCurrentManifest(this.manifest);
    this.skipVersionSnapshot = false;
    this.notify();
  }

  setProjectMeta(name: string, description?: string): void {
    this.touchSession({ projectName: name, description });
    this.touchManifest({ name, description });
  }

  setTool(tool: ToolType): void {
    this.touchSession({ currentTool: tool });
  }

  setWorkspaceMode(mode: WorkspaceMode): void {
    const modeDefaultTool: Partial<Record<WorkspaceMode, ToolType>> = {
      mep: 'mep',
      interior: 'furniture',
      landscape: 'landscape',
    };
    const nextTool = modeDefaultTool[mode] ?? this.session.currentTool;
    this.touchSession({
      workspaceMode: mode,
      ...(modeDefaultTool[mode] ? { currentTool: nextTool } : {}),
    });
  }

  setZenMode(enabled: boolean): void {
    this.touchSession({ zenMode: enabled });
  }

  setPresentationLock(enabled: boolean): void {
    this.touchSession({ presentationLock: enabled });
  }

  setShow3D(show: boolean): void {
    this.touchSession({ show3DView: show });
  }

  setGridVisible(visible: boolean): void {
    this.touchSession({ gridVisible: visible });
  }

  setSnapEnabled(enabled: boolean): void {
    this.touchSession({ snapEnabled: enabled });
    this.touchManifest({ snapToGrid: enabled });
  }

  setLighting(lighting: LightingConfig): void {
    this.touchManifest({ lighting });
  }

  setSelection(wallId?: string, openingId?: string): void {
    this.touchSession({ selectedWallId: wallId, selectedOpeningId: openingId });
  }

  addWall(wall: Wall): void {
    this.touchManifest({ walls: [...this.manifest.walls, wall] });
  }

  updateWall(wallId: string, updates: Partial<Wall>): void {
    this.touchManifest({
      walls: this.manifest.walls.map((w) => (w.id === wallId ? { ...w, ...updates } : w)),
    });
  }

  removeWall(wallId: string): void {
    this.touchManifest({
      walls: this.manifest.walls.filter((w) => w.id !== wallId),
      openings: this.manifest.openings.filter((o) => o.wallId !== wallId),
    });
    if (this.session.selectedWallId === wallId) {
      this.touchSession({ selectedWallId: undefined });
    }
  }

  addOpening(opening: Opening): void {
    this.touchManifest({ openings: [...this.manifest.openings, opening] });
  }

  updateOpening(openingId: string, updates: Partial<Opening>): void {
    this.touchManifest({
      openings: this.manifest.openings.map((o) => (o.id === openingId ? { ...o, ...updates } : o)),
    });
  }

  removeOpening(openingId: string): void {
    this.touchManifest({
      openings: this.manifest.openings.filter((o) => o.id !== openingId),
    });
  }

  addLabel(label: Label): void {
    this.touchManifest({ labels: [...(this.manifest.labels ?? []), label] });
  }

  addDimension(dimension: DimensionAnnotation): void {
    this.touchManifest({ dimensions: [...(this.manifest.dimensions ?? []), dimension] });
  }

  detectAndSyncRooms(name = 'Room'): Room | null {
    const room = detectRoomFromWalls(this.manifest.walls, name);
    if (!room) return null;

    const existing = (this.manifest.rooms ?? []).filter(
      (candidate) => candidate.wallIds.join(',') !== room.wallIds.join(',')
    );

    this.touchManifest({ rooms: [...existing, room] }, 'Detect room');
    return room;
  }

  detectRoomAtPoint(point: Point2D, name = 'Room'): Room | null {
    const room = detectRoomAtPoint(this.manifest.walls, point, name);
    if (!room) return null;

    const existing = (this.manifest.rooms ?? []).filter(
      (candidate) => candidate.wallIds.join(',') !== room.wallIds.join(',')
    );

    this.touchManifest({ rooms: [...existing, room] }, 'Detect room');
    return room;
  }

  addFurniture(item: FurnitureItem): void {
    this.touchManifest({ furniture: [...(this.manifest.furniture ?? []), item] });
  }

  updateFurniture(furnitureId: string, updates: Partial<FurnitureItem>): void {
    this.touchManifest({
      furniture: (this.manifest.furniture ?? []).map((item) =>
        item.id === furnitureId ? { ...item, ...updates } : item
      ),
    });
  }

  removeFurniture(furnitureId: string): void {
    this.touchManifest({
      furniture: (this.manifest.furniture ?? []).filter((item) => item.id !== furnitureId),
    });
  }

  addMepSymbol(symbol: MepSymbol): void {
    this.touchManifest({ mepSymbols: [...(this.manifest.mepSymbols ?? []), symbol] });
  }

  removeMepSymbol(symbolId: string): void {
    this.touchManifest({
      mepSymbols: (this.manifest.mepSymbols ?? []).filter((symbol) => symbol.id !== symbolId),
    });
  }

  addLandscapeElement(element: LandscapeElement): void {
    this.touchManifest({
      landscapeElements: [...(this.manifest.landscapeElements ?? []), element],
    });
  }

  removeLandscapeElement(elementId: string): void {
    this.touchManifest({
      landscapeElements: (this.manifest.landscapeElements ?? []).filter(
        (element) => element.id !== elementId
      ),
    });
  }

  setNorthOrientation(degrees: number): void {
    const normalized = ((degrees % 360) + 360) % 360;
    this.touchManifest({ northOrientation: normalized }, 'Set north');
  }

  recalculateCostItems(): void {
    this.touchManifest({ costItems: calculateProjectCostItems(this.manifest) }, 'Recalculate cost');
  }

  replaceGeometry(input: {
    walls: Wall[];
    openings: Opening[];
    labels?: Label[];
    dimensions?: DimensionAnnotation[];
  }): void {
    this.touchManifest({
      walls: input.walls,
      openings: input.openings,
      labels: input.labels ?? this.manifest.labels,
      dimensions: input.dimensions ?? this.manifest.dimensions,
    });
  }

  buildManifest(): ProjectManifest {
    return {
      ...this.manifest,
      name: this.session.projectName,
      description: this.session.description,
      snapToGrid: this.session.snapEnabled,
    };
  }

  undo(): boolean {
    const restored = this.versionControl.undo();
    if (!restored) return false;
    this.skipVersionSnapshot = true;
    this.manifest = restored;
    this.skipVersionSnapshot = false;
    this.notify();
    return true;
  }

  redo(): boolean {
    const restored = this.versionControl.redo();
    if (!restored) return false;
    this.skipVersionSnapshot = true;
    this.manifest = restored;
    this.skipVersionSnapshot = false;
    this.notify();
    return true;
  }

  applyTemplate(manifest: ProjectManifest): void {
    this.loadManifest(createProjectManifest({ ...manifest, name: manifest.name }));
  }
}

export function getFloorPlanEngine(): FloorPlanEngine {
  return FloorPlanEngine.getInstance();
}
