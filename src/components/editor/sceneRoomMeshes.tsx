/// <reference path="../../three.d.ts" />
import type { Room, Wall } from '@/types';
import { canvasToWorld, type SceneOrigin } from '@/core/sceneVisualCatalog';
import { FloorSurfaceMaterial } from '@/components/editor/sceneMaterials';

export function RoomVolumeMeshes({
  rooms,
  origin,
  floorMaterial = 'material-concrete',
}: {
  rooms: Room[];
  walls: Wall[];
  origin: SceneOrigin;
  floorMaterial?: string;
}) {
  return (
    <>
      {rooms.map((room) => {
        if (!room.center) return null;
        const center = canvasToWorld(room.center, origin);
        const span = Math.sqrt(Math.max(room.area ?? 4, 1));

        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={room.id}>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh position={[center.x, 0.015, center.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <planeGeometry args={[span, span]} />
              <FloorSurfaceMaterial floorMaterial={floorMaterial} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh position={[center.x, 2.35, center.z]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <planeGeometry args={[span * 0.95, span * 0.95]} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <meshBasicMaterial color="#b8941f" transparent opacity={0.06} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}
