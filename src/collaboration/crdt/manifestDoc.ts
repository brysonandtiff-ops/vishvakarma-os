import * as Y from 'yjs';
import type { ProjectManifest } from '@/types';

export const MANIFEST_ROOT_KEY = 'manifest';
export const META_KEY = 'meta';
export const WALLS_KEY = 'walls';
export const WALL_ORDER_KEY = 'wallOrder';
export const OPENINGS_KEY = 'openings';
export const OPENING_ORDER_KEY = 'openingOrder';
export const ROOMS_KEY = 'rooms';
export const ROOM_ORDER_KEY = 'roomOrder';
export const DIMENSIONS_KEY = 'dimensions';
export const DIMENSION_ORDER_KEY = 'dimensionOrder';
export const LABELS_KEY = 'labels';
export const LABEL_ORDER_KEY = 'labelOrder';
export const ROOFS_KEY = 'roofs';
export const ROOF_ORDER_KEY = 'roofOrder';

export interface ManifestDocHandles {
  doc: Y.Doc;
  root: Y.Map<unknown>;
  meta: Y.Map<unknown>;
  walls: Y.Map<unknown>;
  wallOrder: Y.Array<string>;
  openings: Y.Map<unknown>;
  openingOrder: Y.Array<string>;
  rooms: Y.Map<unknown>;
  roomOrder: Y.Array<string>;
  dimensions: Y.Map<unknown>;
  dimensionOrder: Y.Array<string>;
  labels: Y.Map<unknown>;
  labelOrder: Y.Array<string>;
  roofs: Y.Map<unknown>;
  roofOrder: Y.Array<string>;
}

export function createManifestDoc(): ManifestDocHandles {
  const doc = new Y.Doc();
  const root = doc.getMap(MANIFEST_ROOT_KEY);
  const meta = new Y.Map<unknown>();
  const walls = new Y.Map<unknown>();
  const wallOrder = new Y.Array<string>();
  const openings = new Y.Map<unknown>();
  const openingOrder = new Y.Array<string>();
  const rooms = new Y.Map<unknown>();
  const roomOrder = new Y.Array<string>();
  const dimensions = new Y.Map<unknown>();
  const dimensionOrder = new Y.Array<string>();
  const labels = new Y.Map<unknown>();
  const labelOrder = new Y.Array<string>();
  const roofs = new Y.Map<unknown>();
  const roofOrder = new Y.Array<string>();

  root.set(META_KEY, meta);
  root.set(WALLS_KEY, walls);
  root.set(WALL_ORDER_KEY, wallOrder);
  root.set(OPENINGS_KEY, openings);
  root.set(OPENING_ORDER_KEY, openingOrder);
  root.set(ROOMS_KEY, rooms);
  root.set(ROOM_ORDER_KEY, roomOrder);
  root.set(DIMENSIONS_KEY, dimensions);
  root.set(DIMENSION_ORDER_KEY, dimensionOrder);
  root.set(LABELS_KEY, labels);
  root.set(LABEL_ORDER_KEY, labelOrder);
  root.set(ROOFS_KEY, roofs);
  root.set(ROOF_ORDER_KEY, roofOrder);

  return {
    doc,
    root,
    meta,
    walls,
    wallOrder,
    openings,
    openingOrder,
    rooms,
    roomOrder,
    dimensions,
    dimensionOrder,
    labels,
    labelOrder,
    roofs,
    roofOrder,
  };
}

export function getManifestDocHandles(doc: Y.Doc): ManifestDocHandles {
  const root = doc.getMap(MANIFEST_ROOT_KEY);
  return {
    doc,
    root,
    meta: root.get(META_KEY) as Y.Map<unknown>,
    walls: root.get(WALLS_KEY) as Y.Map<unknown>,
    wallOrder: root.get(WALL_ORDER_KEY) as Y.Array<string>,
    openings: root.get(OPENINGS_KEY) as Y.Map<unknown>,
    openingOrder: root.get(OPENING_ORDER_KEY) as Y.Array<string>,
    rooms: root.get(ROOMS_KEY) as Y.Map<unknown>,
    roomOrder: root.get(ROOM_ORDER_KEY) as Y.Array<string>,
    dimensions: root.get(DIMENSIONS_KEY) as Y.Map<unknown>,
    dimensionOrder: root.get(DIMENSION_ORDER_KEY) as Y.Array<string>,
    labels: root.get(LABELS_KEY) as Y.Map<unknown>,
    labelOrder: root.get(LABEL_ORDER_KEY) as Y.Array<string>,
    roofs: root.get(ROOFS_KEY) as Y.Map<unknown>,
    roofOrder: root.get(ROOF_ORDER_KEY) as Y.Array<string>,
  };
}

export function encodeManifestDocState(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  const bytes = new Uint8Array(update);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function applyManifestDocState(doc: Y.Doc, encoded: string): void {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  Y.applyUpdate(doc, bytes);
}

export function isEmptyManifestDoc(handles: ManifestDocHandles): boolean {
  return (
    handles.wallOrder.length === 0 &&
    handles.openingOrder.length === 0 &&
    handles.roomOrder.length === 0 &&
    handles.dimensionOrder.length === 0 &&
    handles.labelOrder.length === 0 &&
    handles.roofOrder.length === 0 &&
    handles.meta.size === 0
  );
}

export type ManifestDocSeed = ProjectManifest | undefined;
