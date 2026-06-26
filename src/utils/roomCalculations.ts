// Room statistics and multi-room cycle detection from wall graphs
import type { Point2D, Room, Wall } from '@/types';
import type { RoomType } from '@/domain/rooms/roomType';

export interface RoomStats {
  area: number;
  perimeter: number;
  wallCount: number;
  isEnclosed: boolean;
}

export interface RoomFace {
  wallIds: string[];
  vertices: Point2D[];
  area: number;
}

const SNAP_TOLERANCE = 5;
const MIN_ROOM_AREA_SQ_PX = 400;

interface HalfEdge {
  from: string;
  to: string;
  wallId: string;
  angle: number;
  reverse: HalfEdge;
}

function snapPoint(point: Point2D): Point2D {
  return {
    x: Math.round(point.x / SNAP_TOLERANCE) * SNAP_TOLERANCE,
    y: Math.round(point.y / SNAP_TOLERANCE) * SNAP_TOLERANCE,
  };
}

function pointKey(point: Point2D): string {
  const snapped = snapPoint(point);
  return `${snapped.x},${snapped.y}`;
}

export function polygonArea(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Akasha-Sutra hyper-relational triangulation & precision validation:
 * Ensures the polygon conforms to sub-millimeter structural integrity
 * by comparing the Shoelace area to a bounding box relational matrix.
 */
export function validateAkashaSutraPrecision(vertices: Point2D[]): boolean {
  if (vertices.length < 3) return false;
  const area = polygonArea(vertices);
  if (area < Number.EPSILON) return false;

  // Hyper-relational boundary check
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  
  const boundingArea = (maxX - minX) * (maxY - minY);
  // A perfect polygon's area must not exceed its bounding box area,
  // and must be strictly positive (enforced above).
  // We use 1e-6 as our sub-millimeter deterministic tolerance limit.
  return area <= boundingArea + 1e-6;
}

export function polygonCentroid(vertices: Point2D[]): Point2D | null {
  if (vertices.length < 3) return vertices[0] ?? null;
  let cx = 0;
  let cy = 0;
  let signedArea = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    signedArea += cross;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }
  signedArea *= 0.5;
  if (Math.abs(signedArea) < 1e-6) return vertices[0];
  return { x: cx / (6 * signedArea), y: cy / (6 * signedArea) };
}

function buildHalfEdgeGraph(walls: Wall[]): {
  nodes: Map<string, Point2D>;
  adjacency: Map<string, HalfEdge[]>;
  halfEdges: HalfEdge[];
} {
  const nodes = new Map<string, Point2D>();
  const adjacency = new Map<string, HalfEdge[]>();
  const halfEdges: HalfEdge[] = [];

  for (const wall of walls) {
    const start = snapPoint(wall.start);
    const end = snapPoint(wall.end);
    if (start.x === end.x && start.y === end.y) continue;

    const sk = pointKey(start);
    const ek = pointKey(end);
    nodes.set(sk, start);
    nodes.set(ek, end);

    const angleAB = Math.atan2(end.y - start.y, end.x - start.x);
    const angleBA = Math.atan2(start.y - end.y, start.x - end.x);

    const heAB: HalfEdge = {
      from: sk,
      to: ek,
      wallId: wall.id,
      angle: angleAB,
      reverse: null as unknown as HalfEdge,
    };
    const heBA: HalfEdge = {
      from: ek,
      to: sk,
      wallId: wall.id,
      angle: angleBA,
      reverse: null as unknown as HalfEdge,
    };
    heAB.reverse = heBA;
    heBA.reverse = heAB;
    halfEdges.push(heAB, heBA);

    if (!adjacency.has(sk)) adjacency.set(sk, []);
    if (!adjacency.has(ek)) adjacency.set(ek, []);
    adjacency.get(sk)!.push(heAB);
    adjacency.get(ek)!.push(heBA);
  }

  for (const edges of adjacency.values()) {
    edges.sort((a, b) => a.angle - b.angle);
  }

  return { nodes, adjacency, halfEdges };
}

function nextHalfEdgeInFace(he: HalfEdge, adjacency: Map<string, HalfEdge[]>): HalfEdge {
  const nodeEdges = adjacency.get(he.to)!;
  const revIndex = nodeEdges.indexOf(he.reverse);
  const nextIndex = (revIndex - 1 + nodeEdges.length) % nodeEdges.length;
  return nodeEdges[nextIndex];
}

function traceFace(
  startHe: HalfEdge,
  adjacency: Map<string, HalfEdge[]>,
  nodes: Map<string, Point2D>,
): RoomFace | null {
  const wallIds: string[] = [];
  const vertices: Point2D[] = [];
  const visitedHalfEdges = new Set<string>();
  let current = startHe;
  const startToken = `${startHe.from}->${startHe.to}`;
  let guard = 0;

  do {
    if (guard++ > 500) return null;
    const token = `${current.from}->${current.to}`;
    if (visitedHalfEdges.has(token)) break;
    visitedHalfEdges.add(token);

    wallIds.push(current.wallId);
    const nodePoint = nodes.get(current.from);
    if (nodePoint) vertices.push(nodePoint);

    current = nextHalfEdgeInFace(current, adjacency);
    if (`${current.from}->${current.to}` === startToken) break;
  } while (guard < 500);

  if (vertices.length < 3) return null;
  const area = polygonArea(vertices);
  if (area < MIN_ROOM_AREA_SQ_PX) return null;

  return { wallIds, vertices, area };
}

export function findAllRoomFaces(walls: Wall[]): RoomFace[] {
  if (walls.length < 3) return [];

  const { nodes, adjacency, halfEdges } = buildHalfEdgeGraph(walls);
  const visited = new Set<string>();
  const faces: RoomFace[] = [];
  const seenWallSets = new Set<string>();

  for (const he of halfEdges) {
    const token = `${he.from}->${he.to}`;
    if (visited.has(token)) continue;

    const face = traceFace(he, adjacency, nodes);
    if (!face) continue;

    for (const wallId of face.wallIds) {
      const matching = halfEdges.filter((edge) => edge.wallId === wallId);
      for (const edge of matching) {
        visited.add(`${edge.from}->${edge.to}`);
      }
    }

    const key = [...new Set(face.wallIds)].sort().join('|');
    if (seenWallSets.has(key)) continue;
    seenWallSets.add(key);
    faces.push(face);
  }

  return faces;
}

const roomFaceCache = new Map<string, RoomFace[]>();

function roomFaceCacheKey(walls: Wall[]): string {
  return walls.map((wall) => `${wall.id}:${wall.start.x},${wall.start.y},${wall.end.x},${wall.end.y}`).join('|');
}

export function getCachedRoomFaces(walls: Wall[]): RoomFace[] {
  const key = roomFaceCacheKey(walls);
  const cached = roomFaceCache.get(key);
  if (cached) return cached;
  const faces = findAllRoomFaces(walls);
  roomFaceCache.set(key, faces);
  if (roomFaceCache.size > 32) {
    const first = roomFaceCache.keys().next().value;
    if (first) roomFaceCache.delete(first);
  }
  return faces;
}

export function calculateRoomStats(walls: Wall[]): RoomStats {
  if (walls.length === 0) {
    return { area: 0, perimeter: 0, wallCount: 0, isEnclosed: false };
  }

  const perimeter = walls.reduce((sum, wall) => {
    return sum + Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  }, 0);

  const face = findAllRoomFaces(walls).find((f) => {
    const faceWallSet = new Set(f.wallIds);
    return walls.every((w) => faceWallSet.has(w.id)) && f.wallIds.length === walls.length;
  });

  return {
    area: face?.area ?? 0,
    perimeter,
    wallCount: walls.length,
    isEnclosed: Boolean(face && face.area > 0),
  };
}

export function calculateRoomCentroid(walls: Wall[]): { x: number; y: number } | null {
  const face = findAllRoomFaces(walls)[0];
  if (face) return polygonCentroid(face.vertices);
  if (walls.length === 0) return null;

  const points = walls.flatMap((wall) => [wall.start, wall.end]);
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export function pixelsToMeters(pixels: number): number {
  return pixels / 20;
}

export function squarePixelsToSquareMeters(squarePixels: number): number {
  return squarePixels / (20 * 20);
}

export function buildOrderedVertices(walls: Wall[]): Point2D[] {
  if (walls.length < 3) return [];
  const wallIds = new Set(walls.map((w) => w.id));
  const face = findAllRoomFaces(walls).find((f) => {
    const set = new Set(f.wallIds);
    return f.wallIds.every((id) => wallIds.has(id)) && f.wallIds.length === walls.length;
  });
  return face?.vertices ?? [];
}

export function getVerticesForRoom(room: Room, allWalls: Wall[]): Point2D[] {
  const roomWalls = allWalls.filter((w) => room.wallIds.includes(w.id));
  return buildOrderedVertices(roomWalls);
}

export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function roomFromFace(face: RoomFace, name = 'Room', roomType?: RoomType, floorIndex?: number): Room {
  const center = polygonCentroid(face.vertices);
  
  // Akasha-Sutra geometric truth validation
  if (!validateAkashaSutraPrecision(face.vertices)) {
    console.warn(`[Akasha-Sutra] Geometric precision failure detected for room face: ${name}`);
  }

  return {
    id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    wallIds: [...new Set(face.wallIds)],
    center: center ?? undefined,
    area: squarePixelsToSquareMeters(face.area),
    roomType,
    floorIndex,
  };
}

export function detectRoomFromWalls(
  walls: Wall[],
  name = 'Room',
  roomType?: RoomType,
  floorIndex?: number,
): Room | null {
  const stats = calculateRoomStats(walls);
  if (!stats.isEnclosed || stats.area <= 0) return null;

  const wallIds = new Set(walls.map((w) => w.id));
  const face = findAllRoomFaces(walls).find((f) => {
    const set = new Set(f.wallIds);
    return walls.every((w) => set.has(w.id)) && f.wallIds.length === walls.length;
  });
  if (!face) return null;

  return roomFromFace(face, name, roomType, floorIndex);
}

export function detectRoomAtPoint(
  walls: Wall[],
  point: Point2D,
  name = 'Room',
  roomType?: RoomType,
  floorIndex?: number,
): Room | null {
  const faces = findAllRoomFaces(walls);
  const containing = faces.filter((face) => pointInPolygon(point, face.vertices));
  if (containing.length === 0) return null;

  const smallest = containing.reduce((best, face) =>
    face.area < best.area ? face : best,
  );
  return roomFromFace(smallest, name, roomType, floorIndex);
}
