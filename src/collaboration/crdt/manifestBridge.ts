import * as Y from 'yjs';
import { PROJECT_SPEC_VERSION } from '@/core/projectModel';
import { calculateProjectCostItems } from '@/utils/costEstimate';
import type {
  DimensionAnnotation,
  Label,
  Opening,
  ProjectManifest,
  Roof,
  Room,
  Wall,
} from '@/types';
import {
  applyManifestDocState,
  createManifestDoc,
  encodeManifestDocState,
  getManifestDocHandles,
  type ManifestDocHandles,
} from './manifestDoc';

const META_SCALAR_KEYS = [
  'version',
  'name',
  'description',
  'floorMaterial',
  'gridSize',
  'snapToGrid',
  'northOrientation',
  'dimensionVisibility',
  'activeFloorIndex',
  'camera',
  'lighting',
  'materials',
  'furniture',
  'mepSymbols',
  'plumbingRuns',
  'landscapeElements',
  'measurements',
  'costItems',
  'staircases',
  'ceilingZones',
  'fixtures',
  'floors',
  'terrain',
  'metadata',
] as const;

function syncOrderedCollection<T extends { id: string }>(
  items: T[] | undefined,
  entityMap: Y.Map<unknown>,
  orderArray: Y.Array<string>
): void {
  const list = items ?? [];
  const nextIds = list.map((item) => item.id);
  const existingIds = new Set<string>();

  for (const id of orderArray.toArray()) {
    existingIds.add(id);
  }

  for (const item of list) {
    entityMap.set(item.id, structuredClone(item));
  }

  for (const id of existingIds) {
    if (!nextIds.includes(id)) {
      entityMap.delete(id);
    }
  }

  orderArray.delete(0, orderArray.length);
  if (nextIds.length > 0) {
    orderArray.insert(0, nextIds);
  }
}

function readOrderedCollection<T>(entityMap: Y.Map<unknown>, orderArray: Y.Array<string>): T[] {
  return orderArray
    .toArray()
    .map((id) => entityMap.get(id))
    .filter((value): value is T => value !== undefined);
}

function readMeta(handles: ManifestDocHandles): Partial<ProjectManifest> {
  const meta: Record<string, unknown> = {};
  for (const key of META_SCALAR_KEYS) {
    const value = handles.meta.get(key);
    if (value !== undefined) {
      meta[key] = value;
    }
  }
  return meta as Partial<ProjectManifest>;
}

export function manifestFromDoc(handles: ManifestDocHandles): ProjectManifest {
  const meta = readMeta(handles);
  const manifest: ProjectManifest = {
    version: (meta.version as string) ?? PROJECT_SPEC_VERSION,
    name: (meta.name as string) ?? 'Untitled Project',
    description: meta.description as string | undefined,
    walls: readOrderedCollection<Wall>(handles.walls, handles.wallOrder),
    openings: readOrderedCollection<Opening>(handles.openings, handles.openingOrder),
    labels: readOrderedCollection<Label>(handles.labels, handles.labelOrder),
    dimensions: readOrderedCollection<DimensionAnnotation>(
      handles.dimensions,
      handles.dimensionOrder
    ),
    rooms: readOrderedCollection<Room>(handles.rooms, handles.roomOrder),
    roofs: readOrderedCollection<Roof>(handles.roofs, handles.roofOrder),
    materials: (meta.materials as ProjectManifest['materials']) ?? [],
    floorMaterial: (meta.floorMaterial as string) ?? 'material-concrete',
    lighting: (meta.lighting as ProjectManifest['lighting']) ?? {
      sunAzimuth: 180,
      sunElevation: 45,
      timeOfDay: 12,
      intensity: 1,
    },
    gridSize: (meta.gridSize as number) ?? 20,
    snapToGrid: (meta.snapToGrid as boolean) ?? true,
    northOrientation: meta.northOrientation as number | undefined,
    dimensionVisibility: meta.dimensionVisibility as boolean | undefined,
    activeFloorIndex: meta.activeFloorIndex as number | undefined,
    camera: meta.camera as ProjectManifest['camera'],
    furniture: meta.furniture as ProjectManifest['furniture'],
    mepSymbols: meta.mepSymbols as ProjectManifest['mepSymbols'],
    plumbingRuns: meta.plumbingRuns as ProjectManifest['plumbingRuns'],
    landscapeElements: meta.landscapeElements as ProjectManifest['landscapeElements'],
    measurements: meta.measurements as ProjectManifest['measurements'],
    costItems: meta.costItems as ProjectManifest['costItems'],
    staircases: meta.staircases as ProjectManifest['staircases'],
    ceilingZones: meta.ceilingZones as ProjectManifest['ceilingZones'],
    fixtures: meta.fixtures as ProjectManifest['fixtures'],
    floors: meta.floors as ProjectManifest['floors'],
    terrain: meta.terrain as ProjectManifest['terrain'],
    metadata: (meta.metadata as ProjectManifest['metadata']) ?? {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  };

  if (!manifest.costItems) {
    manifest.costItems = calculateProjectCostItems(manifest);
  }

  return manifest;
}

export function seedDocFromManifest(handles: ManifestDocHandles, manifest: ProjectManifest): void {
  const { doc } = handles;
  doc.transact(() => {
    for (const key of META_SCALAR_KEYS) {
      const value = manifest[key as keyof ProjectManifest];
      if (value !== undefined) {
        handles.meta.set(key, structuredClone(value));
      }
    }
    syncOrderedCollection(manifest.walls, handles.walls, handles.wallOrder);
    syncOrderedCollection(manifest.openings, handles.openings, handles.openingOrder);
    syncOrderedCollection(manifest.rooms, handles.rooms, handles.roomOrder);
    syncOrderedCollection(manifest.dimensions, handles.dimensions, handles.dimensionOrder);
    syncOrderedCollection(manifest.labels, handles.labels, handles.labelOrder);
    syncOrderedCollection(manifest.roofs, handles.roofs, handles.roofOrder);
  });
}

export function applyPartialToDoc(
  handles: ManifestDocHandles,
  partial: Partial<ProjectManifest>,
  origin?: unknown
): void {
  const { doc } = handles;
  doc.transact(() => {
    for (const key of META_SCALAR_KEYS) {
      if (key in partial) {
        const value = partial[key as keyof ProjectManifest];
        if (value === undefined) {
          handles.meta.delete(key);
        } else {
          handles.meta.set(key, structuredClone(value));
        }
      }
    }

    if (partial.walls !== undefined) {
      syncOrderedCollection(partial.walls, handles.walls, handles.wallOrder);
    }
    if (partial.openings !== undefined) {
      syncOrderedCollection(partial.openings, handles.openings, handles.openingOrder);
    }
    if (partial.rooms !== undefined) {
      syncOrderedCollection(partial.rooms, handles.rooms, handles.roomOrder);
    }
    if (partial.dimensions !== undefined) {
      syncOrderedCollection(partial.dimensions, handles.dimensions, handles.dimensionOrder);
    }
    if (partial.labels !== undefined) {
      syncOrderedCollection(partial.labels, handles.labels, handles.labelOrder);
    }
    if (partial.roofs !== undefined) {
      syncOrderedCollection(partial.roofs, handles.roofs, handles.roofOrder);
    }

    const modified = new Date().toISOString();
    const existingMeta = (handles.meta.get('metadata') as ProjectManifest['metadata']) ?? {
      created: modified,
      modified,
    };
    handles.meta.set('metadata', { ...existingMeta, modified });
  }, origin);
}

export class ManifestCollabBridge {
  private handles: ManifestDocHandles;
  private active = false;
  private remoteListener: ((manifest: ProjectManifest, isRemote: boolean) => void) | null = null;
  private localOrigin: symbol;
  private undoManager: Y.UndoManager;

  constructor(manifest?: ProjectManifest) {
    this.handles = createManifestDoc();
    this.localOrigin = Symbol('local-collab-origin');
    this.undoManager = new Y.UndoManager(
      [
        this.handles.meta,
        this.handles.walls,
        this.handles.wallOrder,
        this.handles.openings,
        this.handles.openingOrder,
        this.handles.rooms,
        this.handles.roomOrder,
        this.handles.dimensions,
        this.handles.dimensionOrder,
        this.handles.labels,
        this.handles.labelOrder,
        this.handles.roofs,
        this.handles.roofOrder,
      ],
      { trackedOrigins: new Set([this.localOrigin]) }
    );

    if (manifest) {
      seedDocFromManifest(this.handles, manifest);
    }

    this.handles.doc.on('update', (_update, origin) => {
      if (!this.remoteListener) return;
      const isRemote = origin !== this.localOrigin && origin !== null;
      this.remoteListener(manifestFromDoc(this.handles), isRemote);
    });
  }

  getDoc(): Y.Doc {
    return this.handles.doc;
  }

  getHandles(): ManifestDocHandles {
    return this.handles;
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  setRemoteListener(listener: ((manifest: ProjectManifest, isRemote: boolean) => void) | null): void {
    this.remoteListener = listener;
  }

  toManifest(): ProjectManifest {
    return manifestFromDoc(this.handles);
  }

  loadManifest(manifest: ProjectManifest): void {
    seedDocFromManifest(this.handles, manifest);
  }

  applyPartial(partial: Partial<ProjectManifest>, _snapshotLabel = 'Edit'): void {
    applyPartialToDoc(this.handles, partial, this.localOrigin);
  }

  applyEncodedState(encoded: string): void {
    const tempDoc = new Y.Doc();
    applyManifestDocState(tempDoc, encoded);
    const restoredManifest = manifestFromDoc(getManifestDocHandles(tempDoc));
    seedDocFromManifest(this.handles, restoredManifest);
    tempDoc.destroy();
  }

  encodeState(): string {
    return encodeManifestDocState(this.handles.doc);
  }

  undo(): void {
    this.undoManager.undo();
  }

  redo(): void {
    this.undoManager.redo();
  }

  canUndo(): boolean {
    return this.undoManager.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.undoManager.redoStack.length > 0;
  }

  destroy(): void {
    this.undoManager.destroy();
    this.handles.doc.destroy();
    this.remoteListener = null;
    this.active = false;
  }
}
