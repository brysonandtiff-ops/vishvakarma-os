import {
  DEFAULT_WALL_MATERIAL,
  DOOR_HEIGHT_PX,
  DOOR_WIDTH_PX,
  WALL_HEIGHT_PX,
  WALL_THICKNESS_PX,
  WINDOW_HEIGHT_PX,
  WINDOW_SILL_PX,
  WINDOW_WIDTH_PX,
} from '@/domain/constants';
import type { GeneratedFloorPlan, RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { Opening, Point2D, Wall } from '@/types';

function wallKey(start: Point2D, end: Point2D) {
  const a = `${start.x},${start.y}`;
  const b = `${end.x},${end.y}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function addWall(map: Map<string, Wall>, id: string, start: Point2D, end: Point2D) {
  const key = wallKey(start, end);
  if (map.has(key)) return map.get(key)!;
  const wall: Wall = {
    id,
    start,
    end,
    thickness: WALL_THICKNESS_PX,
    height: WALL_HEIGHT_PX,
    material: DEFAULT_WALL_MATERIAL,
    floorIndex: 0,
  };
  map.set(key, wall);
  return wall;
}

function roomBounds(room: RoomPlacement) {
  return {
    left: room.x,
    right: room.x + room.width,
    top: room.y,
    bottom: room.y + room.depth,
  };
}

function isExteriorWall(
  wallStart: Point2D,
  wallEnd: Point2D,
  rooms: RoomPlacement[],
  room: RoomPlacement
): boolean {
  const mid = { x: (wallStart.x + wallEnd.x) / 2, y: (wallStart.y + wallEnd.y) / 2 };
  const b = roomBounds(room);

  const onNorth = Math.abs(mid.y - b.top) < 2 && mid.x >= b.left && mid.x <= b.right;
  const onSouth = Math.abs(mid.y - b.bottom) < 2 && mid.x >= b.left && mid.x <= b.right;
  const onWest = Math.abs(mid.x - b.left) < 2 && mid.y >= b.top && mid.y <= b.bottom;
  const onEast = Math.abs(mid.x - b.right) < 2 && mid.y >= b.top && mid.y <= b.bottom;

  if (!(onNorth || onSouth || onWest || onEast)) return false;

  for (const other of rooms) {
    if (other.id === room.id) continue;
    const ob = roomBounds(other);
    if (onNorth && Math.abs(ob.bottom - b.top) < 4 && rangesOverlap(b.left, b.right, ob.left, ob.right)) return false;
    if (onSouth && Math.abs(ob.top - b.bottom) < 4 && rangesOverlap(b.left, b.right, ob.left, ob.right)) return false;
    if (onWest && Math.abs(ob.right - b.left) < 4 && rangesOverlap(b.top, b.bottom, ob.top, ob.bottom)) return false;
    if (onEast && Math.abs(ob.left - b.right) < 4 && rangesOverlap(b.top, b.bottom, ob.top, ob.bottom)) return false;
  }

  return true;
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number) {
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export function generateFloorPlan(
  rooms: RoomPlacement[],
  circulation: Point2D[]
): GeneratedFloorPlan {
  const wallMap = new Map<string, Wall>();
  let wallIndex = 0;

  for (const room of rooms) {
    const { left, right, top, bottom } = roomBounds(room);
    addWall(wallMap, `wall-${wallIndex++}`, { x: left, y: top }, { x: right, y: top });
    addWall(wallMap, `wall-${wallIndex++}`, { x: right, y: top }, { x: right, y: bottom });
    addWall(wallMap, `wall-${wallIndex++}`, { x: right, y: bottom }, { x: left, y: bottom });
    addWall(wallMap, `wall-${wallIndex++}`, { x: left, y: bottom }, { x: left, y: top });
  }

  const walls = [...wallMap.values()];
  const openings: Opening[] = [];
  let openingIndex = 0;

  const entry = rooms.find((r) => r.type === 'Entry') ?? rooms.find((r) => r.type === 'Living');
  if (entry) {
    const b = roomBounds(entry);
    const southWall = walls.find(
      (w) =>
        Math.abs(w.start.y - b.bottom) < 2 &&
        Math.abs(w.end.y - b.bottom) < 2 &&
        rangesOverlap(b.left, b.right, Math.min(w.start.x, w.end.x), Math.max(w.start.x, w.end.x))
    );
    if (southWall) {
      openings.push({
        id: `door-${openingIndex++}`,
        type: 'door',
        wallId: southWall.id,
        position: 0.5,
        width: DOOR_WIDTH_PX,
        height: DOOR_HEIGHT_PX,
      });
    }
  }

  const garage = rooms.find((r) => r.type === 'Garage');
  if (garage) {
    const b = roomBounds(garage);
    const southWall = walls.find(
      (w) =>
        Math.abs(w.start.y - b.bottom) < 2 &&
        Math.abs(w.end.y - b.bottom) < 2 &&
        rangesOverlap(b.left, b.right, Math.min(w.start.x, w.end.x), Math.max(w.start.x, w.end.x))
    );
    if (southWall) {
      openings.push({
        id: `door-${openingIndex++}`,
        type: 'door',
        wallId: southWall.id,
        position: 0.35,
        width: DOOR_WIDTH_PX * 1.4,
        height: DOOR_HEIGHT_PX,
      });
    }
  }

  for (const room of rooms.filter((r) => ['Kitchen', 'Dining', 'Living', 'Bedroom', 'MasterBedroom'].includes(r.type))) {
    const b = roomBounds(room);
    const northWall = walls.find(
      (w) =>
        Math.abs(w.start.y - b.top) < 2 &&
        Math.abs(w.end.y - b.top) < 2 &&
        isExteriorWall(w.start, w.end, rooms, room)
    );
    if (northWall && room.type !== 'Garage') {
      openings.push({
        id: `win-${openingIndex++}`,
        type: 'window',
        wallId: northWall.id,
        position: 0.5,
        width: WINDOW_WIDTH_PX,
        height: WINDOW_HEIGHT_PX,
        sillHeight: WINDOW_SILL_PX,
      });
    }
  }

  for (const room of rooms.filter((r) => ['Bathroom', 'Ensuite', 'Bedroom', 'MasterBedroom'].includes(r.type))) {
    const b = roomBounds(room);
    const interiorWalls = walls.filter((w) => {
      const mid = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 };
      return mid.x > b.left && mid.x < b.right && mid.y > b.top && mid.y < b.bottom;
    });
    const target = interiorWalls[0];
    if (target && !openings.some((o) => o.wallId === target.id && o.type === 'door')) {
      openings.push({
        id: `door-${openingIndex++}`,
        type: 'door',
        wallId: target.id,
        position: 0.45,
        width: DOOR_WIDTH_PX * 0.8,
        height: DOOR_HEIGHT_PX,
      });
    }
  }

  return { rooms, walls, openings, circulation };
}
