import { PX_PER_METER } from '@/domain/constants';
import type { GeneratedFloorPlan } from '@/domain/buildings/generatedBuilding';
import type { BuildingSchedules } from '@/domain/buildings/generatedBuilding';

function pxToM(px: number) {
  return Math.round((px / PX_PER_METER) * 100) / 100;
}

export function generateSchedules(floorPlan: GeneratedFloorPlan): BuildingSchedules {
  const rooms = floorPlan.rooms.map((room) => ({
    id: room.id,
    name: room.label,
    type: room.type,
    areaSqM: pxToM(room.width) * pxToM(room.depth),
    floor: room.floor,
  }));

  const walls = floorPlan.walls.map((wall) => {
    const lengthPx = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    return {
      id: wall.id,
      lengthM: pxToM(lengthPx),
      heightM: pxToM(wall.height),
      material: wall.material,
      floor: wall.floorIndex ?? 0,
    };
  });

  const roomByWall = new Map<string, string>();
  for (const room of floorPlan.rooms) {
    for (const wall of floorPlan.walls) {
      const mid = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
      if (
        mid.x >= room.x &&
        mid.x <= room.x + room.width &&
        mid.y >= room.y &&
        mid.y <= room.y + room.depth
      ) {
        roomByWall.set(wall.id, room.label);
      }
    }
  }

  const windows = floorPlan.openings
    .filter((o) => o.type === 'window')
    .map((o) => ({
      id: o.id,
      wallId: o.wallId,
      widthM: pxToM(o.width),
      heightM: pxToM(o.height),
      sillHeightM: pxToM(o.sillHeight ?? 0),
      roomLabel: roomByWall.get(o.wallId),
    }));

  return { rooms, walls, windows };
}
