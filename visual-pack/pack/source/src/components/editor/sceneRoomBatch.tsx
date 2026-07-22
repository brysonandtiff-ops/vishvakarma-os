/// <reference path="../../three.d.ts" />
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ROOM_BATCH_THRESHOLD = 5;

export function shouldBatchRooms(roomCount: number, atmosphereMode: string): boolean {
  return roomCount >= ROOM_BATCH_THRESHOLD && atmosphereMode !== 'cinematic';
}

export function applyGeometryVertexColor(geometry: THREE.BufferGeometry, hex: string): void {
  const color = new THREE.Color(hex);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export type RoomFloorEntry = {
  floorGeom: THREE.ShapeGeometry;
  tint: string;
};

export function BatchedRoomFloors({
  entries,
  cacheKey,
}: {
  entries: RoomFloorEntry[];
  cacheKey: string;
}) {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const entry of entries) {
      const part = entry.floorGeom.clone();
      part.rotateX(-Math.PI / 2);
      part.translate(0, 0.015, 0);
      applyGeometryVertexColor(part, entry.tint);
      parts.push(part);
    }
    if (parts.length === 0) return null;
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    return merged;
  }, [cacheKey]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry) return null;

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh geometry={geometry} receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}
