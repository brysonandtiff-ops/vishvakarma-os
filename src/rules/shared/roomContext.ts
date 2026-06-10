import { PX_PER_METER } from '@/domain/constants';
import { calculateRoomStats } from '@/utils/roomCalculations';
import type { Point2D, ProjectManifest, Room, Wall } from '@/types';

export interface ResolvedRoom {
  id: string;
  name: string;
  isBedroom: boolean;
  areaSqM: number;
  widthM: number;
  depthM: number;
  wallIds: string[];
  center?: Point2D;
}

function pxToM(px: number) {
  return px / PX_PER_METER;
}

function isBedroomName(name: string) {
  return /bedroom|master\s*bed/i.test(name);
}

function boundsFromWalls(walls: Wall[]) {
  const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, widthPx: maxX - minX, depthPx: maxY - minY };
}

function resolveRoomMetrics(room: Room, walls: Wall[], gridSize: number): ResolvedRoom {
  const roomWalls = walls.filter((w) => room.wallIds.includes(w.id));
  const stats = calculateRoomStats(roomWalls);
  const areaSqM =
    room.area ??
    (stats.isEnclosed ? stats.area / (gridSize * gridSize) : 0);
  const bounds = boundsFromWalls(roomWalls);
  const widthM = pxToM(bounds.widthPx);
  const depthM = pxToM(bounds.depthPx);

  return {
    id: room.id,
    name: room.name,
    isBedroom: isBedroomName(room.name),
    areaSqM,
    widthM: Math.min(widthM, depthM),
    depthM: Math.max(widthM, depthM),
    wallIds: room.wallIds,
    center: room.center,
  };
}

export function resolveRooms(manifest: ProjectManifest): ResolvedRoom[] {
  const walls = manifest.walls ?? [];
  const gridSize = manifest.gridSize || PX_PER_METER;
  const rooms = manifest.rooms ?? [];

  if (rooms.length > 0) {
    return rooms.map((room) => resolveRoomMetrics(room, walls, gridSize));
  }

  const labels = manifest.labels ?? [];
  return labels
    .filter((label) => isBedroomName(label.text))
    .map((label) => ({
      id: label.id,
      name: label.text,
      isBedroom: true,
      areaSqM: 0,
      widthM: 0,
      depthM: 0,
      wallIds: [] as string[],
      center: label.position,
    }));
}

export function getBedrooms(manifest: ProjectManifest): ResolvedRoom[] {
  return resolveRooms(manifest).filter((r) => r.isBedroom);
}
