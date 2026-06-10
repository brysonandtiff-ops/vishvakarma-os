import { PX_PER_METER } from '@/domain/constants';
import type { Opening, ProjectManifest } from '@/types';

export function openingsOnWalls(manifest: ProjectManifest, wallIds: string[]): Opening[] {
  const set = new Set(wallIds);
  return manifest.openings.filter((o) => set.has(o.wallId));
}

export function hasDoorOnWalls(manifest: ProjectManifest, wallIds: string[]): boolean {
  return openingsOnWalls(manifest, wallIds).some((o) => o.type === 'door');
}

export function hasWindowOnWalls(manifest: ProjectManifest, wallIds: string[]): boolean {
  return openingsOnWalls(manifest, wallIds).some((o) => o.type === 'window');
}

export function doorWidthM(opening: Opening): number {
  return opening.width / PX_PER_METER;
}

export function exteriorWallIds(manifest: ProjectManifest): Set<string> {
  const wallConnectionCount = new Map<string, number>();
  for (const wall of manifest.walls) {
    const startKey = `${wall.start.x},${wall.start.y}`;
    const endKey = `${wall.end.x},${wall.end.y}`;
    for (const key of [startKey, endKey]) {
      wallConnectionCount.set(key, (wallConnectionCount.get(key) ?? 0) + 1);
    }
  }

  const exterior = new Set<string>();
  for (const wall of manifest.walls) {
    const startKey = `${wall.start.x},${wall.start.y}`;
    const endKey = `${wall.end.x},${wall.end.y}`;
    const startConnections = wallConnectionCount.get(startKey) ?? 0;
    const endConnections = wallConnectionCount.get(endKey) ?? 0;
    if (startConnections <= 2 && endConnections <= 2) {
      exterior.add(wall.id);
    }
  }
  return exterior;
}
