import type { BuildingFloor, Opening, ProjectManifest, Room, Wall } from '@/types';

export const DEFAULT_GROUND_FLOOR: BuildingFloor = {
  id: 'floor-ground',
  name: 'Ground Floor',
  elevation: 0,
};

export function wallFloorIndex(wall: Wall): number {
  return wall.floorIndex ?? 0;
}

export function ensureDefaultFloors(manifest: ProjectManifest): ProjectManifest {
  const floors = manifest.floors?.length ? manifest.floors : [DEFAULT_GROUND_FLOOR];
  const activeFloorIndex = Math.min(
    manifest.activeFloorIndex ?? 0,
    Math.max(0, floors.length - 1),
  );
  return { ...manifest, floors, activeFloorIndex };
}

export function getActiveFloorIndex(manifest: ProjectManifest): number {
  return manifest.activeFloorIndex ?? 0;
}

export function getActiveFloor(manifest: ProjectManifest): BuildingFloor {
  const floors = manifest.floors?.length ? manifest.floors : [DEFAULT_GROUND_FLOOR];
  const index = getActiveFloorIndex(manifest);
  return floors[index] ?? floors[0] ?? DEFAULT_GROUND_FLOOR;
}

export function filterWallsByFloor(walls: Wall[], floorIndex: number): Wall[] {
  return walls.filter((wall) => wallFloorIndex(wall) === floorIndex);
}

export function filterOpeningsByFloor(openings: Opening[], walls: Wall[], floorIndex: number): Opening[] {
  const wallIds = new Set(filterWallsByFloor(walls, floorIndex).map((wall) => wall.id));
  return openings.filter((opening) => wallIds.has(opening.wallId));
}

export function filterRoomsByFloor(rooms: Room[], floorIndex: number): Room[] {
  return rooms.filter((room) => (room.floorIndex ?? 0) === floorIndex);
}

export function filterByFloorIndex<T extends { floorIndex?: number }>(items: T[], floorIndex: number): T[] {
  return items.filter((item) => (item.floorIndex ?? 0) === floorIndex);
}

export function createFloor(name: string, elevation: number, index: number): BuildingFloor {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `level-${index}`;
  return {
    id: `floor-${slug}-${index}`,
    name: name.trim() || `Level ${index + 1}`,
    elevation,
  };
}
