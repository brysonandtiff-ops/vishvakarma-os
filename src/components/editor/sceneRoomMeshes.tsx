/// <reference path="../../three.d.ts" />
import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Room, Wall } from '@/types';
import { canvasToWorld, type SceneOrigin } from '@/core/sceneVisualCatalog';
import { FloorSurfaceMaterial } from '@/components/editor/sceneMaterials';
import { getVerticesForRoom } from '@/utils/roomCalculations';
import { roomTypeLabel, type RoomType } from '@/domain/rooms/roomType';
import { getRoomTypeFloorColor } from '@/domain/rooms/roomTypeColors';

function roomFloorColor(room: Room, fallback: string): string {
  return getRoomTypeFloorColor(room.roomType, fallback);
}

function buildShapeGeometry(vertices: { x: number; z: number }[]): THREE.ShapeGeometry | null {
  if (vertices.length < 3) return null;
  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, vertices[0].z);
  for (let i = 1; i < vertices.length; i += 1) {
    shape.lineTo(vertices[i].x, vertices[i].z);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function RoomVolumeMeshes({
  rooms,
  walls,
  origin,
  floorMaterial = 'material-concrete',
}: {
  rooms: Room[];
  walls: Wall[];
  origin: SceneOrigin;
  floorMaterial?: string;
}) {
  const roomMeshes = useMemo(() => {
    return rooms.map((room) => {
      const vertices = getVerticesForRoom(room, walls);
      if (vertices.length < 3) return null;

      const worldVerts = vertices.map((v) => canvasToWorld(v, origin));
      const floorGeom = buildShapeGeometry(worldVerts);
      if (!floorGeom) return null;

      const center = room.center
        ? canvasToWorld(room.center, origin)
        : {
            x: worldVerts.reduce((s, v) => s + v.x, 0) / worldVerts.length,
            z: worldVerts.reduce((s, v) => s + v.z, 0) / worldVerts.length,
          };

      const tint = roomFloorColor(room, '#b8941f');
      const labelText = room.roomType
        ? `${roomTypeLabel(room.roomType as RoomType)}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`
        : `${room.name}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`;

      return { room, floorGeom, center, tint, labelText };
    });
  }, [rooms, walls, origin]);

  return (
    <>
      {roomMeshes.map((entry) => {
        if (!entry) return null;
        const { room, floorGeom, center, tint, labelText } = entry;
        const ceilingGeom = floorGeom.clone();

        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={room.id}>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh geometry={floorGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
              {room.roomType ? (
                // @ts-expect-error - React Three Fiber JSX types
                <meshStandardMaterial color={tint} roughness={0.85} metalness={0.05} />
              ) : (
                <FloorSurfaceMaterial floorMaterial={floorMaterial} />
              )}
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh geometry={ceilingGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.35, 0]}>
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <meshBasicMaterial color={tint} transparent opacity={0.06} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            <Text
              position={[center.x, 2.5, center.z]}
              fontSize={0.22}
              color="#2c2c2c"
              anchorX="center"
              anchorY="middle"
              maxWidth={2.5}
            >
              {labelText}
            </Text>
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}
