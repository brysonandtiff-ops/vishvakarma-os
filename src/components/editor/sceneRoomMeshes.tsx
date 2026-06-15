/// <reference path="../../three.d.ts" />
import { Text } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Point2D, Room, Wall } from '@/types';
import { canvasToWorld, type SceneOrigin } from '@/core/sceneVisualCatalog';
import { FloorSurfaceMaterial } from '@/components/editor/sceneMaterials';
import { BatchedRoomFloors, shouldBatchRooms } from '@/components/editor/sceneRoomBatch';
import { getCachedRoomFaces, getVerticesForRoom } from '@/utils/roomCalculations';
import { roomTypeLabel, type RoomType } from '@/domain/rooms/roomType';
import { getRoomTypeFloorColor } from '@/domain/rooms/roomTypeColors';
import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';

const PREMIUM_LABEL_CAP = 12;

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

function verticesForRoom(room: Room, walls: Wall[]): Point2D[] {
  const faces = getCachedRoomFaces(walls);
  const face = faces.find((candidate) => {
    const faceWallSet = new Set(candidate.wallIds);
    return (
      room.wallIds.every((id) => faceWallSet.has(id)) && candidate.wallIds.length === room.wallIds.length
    );
  });
  return face?.vertices ?? getVerticesForRoom(room, walls);
}

export type RoomMeshEntry = {
  room: Room;
  floorGeom: THREE.ShapeGeometry;
  ceilingGeom?: THREE.ShapeGeometry;
  center: { x: number; z: number };
  tint: string;
  labelText: string;
};

function buildRoomMeshEntries(
  rooms: Room[],
  walls: Wall[],
  origin: SceneOrigin,
  showCeiling: boolean,
): (RoomMeshEntry | null)[] {
  return rooms.map((room) => {
    const vertices = verticesForRoom(room, walls);
    if (vertices.length < 3) return null;

    const worldVerts = vertices.map((v) => canvasToWorld(v, origin));
    const floorGeom = buildShapeGeometry(worldVerts);
    if (!floorGeom) return null;

    const center = room.center
      ? canvasToWorld(room.center, origin)
      : {
          x: worldVerts.reduce((sum, v) => sum + v.x, 0) / worldVerts.length,
          z: worldVerts.reduce((sum, v) => sum + v.z, 0) / worldVerts.length,
        };

    const tint = roomFloorColor(room, '#b8941f');
    const labelText = room.roomType
      ? `${roomTypeLabel(room.roomType as RoomType)}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`
      : `${room.name}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`;

    return {
      room,
      floorGeom,
      ceilingGeom: showCeiling ? floorGeom.clone() : undefined,
      center,
      tint,
      labelText,
    };
  });
}

function roomMeshesKey(rooms: Room[], walls: Wall[]): string {
  return `${rooms.map((room) => `${room.id}:${room.wallIds.join(',')}`).join('|')}|${walls.map((wall) => `${wall.id}:${wall.start.x},${wall.start.y},${wall.end.x},${wall.end.y}`).join('|')}`;
}

function RoomLabels({ entries }: { entries: RoomMeshEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <Text
          key={entry.room.id}
          position={[entry.center.x, 2.5, entry.center.z]}
          fontSize={0.22}
          color="#2c2c2c"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {entry.labelText}
        </Text>
      ))}
    </>
  );
}

export function RoomVolumeMeshes({
  rooms,
  walls,
  origin,
  floorMaterial = 'material-concrete',
  atmosphereMode = 'premium',
}: {
  rooms: Room[];
  walls: Wall[];
  origin: SceneOrigin;
  floorMaterial?: string;
  atmosphereMode?: AtmospherePerformanceMode;
}) {
  const showCeiling = atmosphereMode === 'cinematic';
  const showLabels =
    atmosphereMode === 'cinematic' || (atmosphereMode === 'premium' && rooms.length <= PREMIUM_LABEL_CAP);
  const useHeavyFloorMaterial = atmosphereMode === 'cinematic';
  const batchRooms = shouldBatchRooms(rooms.length, atmosphereMode);

  const roomMeshes = useMemo(
    () => buildRoomMeshEntries(rooms, walls, origin, showCeiling),
    [rooms, walls, origin, showCeiling, roomMeshesKey(rooms, walls)],
  );

  useEffect(() => {
    return () => {
      for (const entry of roomMeshes) {
        if (!entry) continue;
        entry.floorGeom.dispose();
        entry.ceilingGeom?.dispose();
      }
    };
  }, [roomMeshes]);

  const validEntries = roomMeshes.filter((entry): entry is RoomMeshEntry => entry !== null);

  if (validEntries.length === 0) return null;

  if (batchRooms) {
    return (
      <>
        <BatchedRoomFloors entries={validEntries} cacheKey={roomMeshesKey(rooms, walls)} />
        {showLabels ? <RoomLabels entries={validEntries} /> : null}
      </>
    );
  }

  return (
    <>
      {validEntries.map((entry) => {
        const { room, floorGeom, ceilingGeom, center, tint, labelText } = entry;
        const useTypedMaterial = Boolean(room.roomType) || !useHeavyFloorMaterial;

        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={room.id}>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh geometry={floorGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
              {useTypedMaterial ? (
                // @ts-expect-error - React Three Fiber JSX types
                <meshStandardMaterial color={tint} roughness={0.85} metalness={0.05} />
              ) : (
                <FloorSurfaceMaterial floorMaterial={floorMaterial} />
              )}
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            {ceilingGeom ? (
              // @ts-expect-error - React Three Fiber JSX types
              <mesh geometry={ceilingGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.35, 0]}>
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <meshBasicMaterial color={tint} transparent opacity={0.06} />
                {/* @ts-expect-error - React Three Fiber JSX types */}
              </mesh>
            ) : null}
            {showLabels ? (
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
            ) : null}
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}
