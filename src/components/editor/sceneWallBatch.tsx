/// <reference path="../../three.d.ts" />
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WallSurfaceMaterial } from '@/components/editor/sceneMaterials';
import type { SceneOrigin } from '@/core/sceneVisualCatalog';
import type { Material, Opening, Wall } from '@/types';

const BATCH_THRESHOLD = 10;

function wallGeometryKey(walls: Wall[]): string {
  return walls
    .map(
      (wall) =>
        `${wall.id}:${wall.start.x},${wall.start.y},${wall.end.x},${wall.end.y}:${wall.thickness}:${wall.height}:${wall.material}`,
    )
    .join('|');
}

export function shouldBatchWalls(wallCount: number, _atmosphereMode: string): boolean {
  // Wall batching is the cheapest way to stabilise the 3D viewport because it
  // collapses many per-wall meshes/draw calls into one geometry. Cinematic mode
  // used to opt out so every wall kept its edge-highlight mesh, which made FPS
  // much easier to tank during demo recording. Keep the threshold identical
  // across all atmosphere tiers so the adaptive governor can downshift visuals
  // without still paying avoidable wall draw-call cost.
  return wallCount >= BATCH_THRESHOLD;
}

export function BatchedWallMeshes({
  walls,
  customMaterials = [],
  origin,
  castShadow = false,
}: {
  walls: Wall[];
  customMaterials?: Material[];
  origin: SceneOrigin;
  castShadow?: boolean;
}) {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const wall of walls) {
      const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
      const centerX = (wall.start.x + wall.end.x) / 2;
      const centerY = (wall.start.y + wall.end.y) / 2;
      const posX = (centerX - origin.cx) / 100;
      const posZ = (centerY - origin.cy) / 100;
      const posY = wall.height / 200;
      const box = new THREE.BoxGeometry(length / 100, wall.height / 100, wall.thickness / 100);
      box.applyMatrix4(new THREE.Matrix4().makeRotationY(-angle).setPosition(posX, posY, posZ));
      parts.push(box);
    }
    if (parts.length === 0) return null;
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    return merged;
  }, [origin.cx, origin.cy, wallGeometryKey(walls)]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry) return null;

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh geometry={geometry} castShadow={castShadow} receiveShadow>
      <WallSurfaceMaterial materialId={walls[0]?.material ?? 'material-paint'} customMaterials={customMaterials} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

export function OpeningMarkers({
  walls,
  openings,
  origin,
}: {
  walls: Wall[];
  openings: Opening[];
  origin: SceneOrigin;
}) {
  return (
    <>
      {walls.flatMap((wall) => {
        const wallOpenings = openings.filter((opening) => opening.wallId === wall.id);
        const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
        const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
        const centerX = (wall.start.x + wall.end.x) / 2;
        const centerY = (wall.start.y + wall.end.y) / 2;
        const posX = (centerX - origin.cx) / 100;
        const posZ = (centerY - origin.cy) / 100;

        return wallOpenings.map((opening) => {
          const openingPosX = posX + ((opening.position - 0.5) * length) / 100 * Math.cos(-angle);
          const openingPosZ = posZ + ((opening.position - 0.5) * length) / 100 * Math.sin(-angle);
          const openingPosY =
            opening.type === 'door'
              ? opening.height / 200
              : (opening.sillHeight || 90) / 100 + opening.height / 200;

          return (
            // @ts-expect-error - React Three Fiber JSX types
            <mesh
              key={opening.id}
              position={[openingPosX, openingPosY, openingPosZ]}
              rotation={[0, -angle, 0]}
            >
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <boxGeometry args={[opening.width / 100, opening.height / 100, wall.thickness / 100 + 0.02]} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <meshStandardMaterial color={opening.type === 'door' ? '#8b6914' : '#87ceeb'} transparent opacity={0.75} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
          );
        });
      })}
    </>
  );
}
