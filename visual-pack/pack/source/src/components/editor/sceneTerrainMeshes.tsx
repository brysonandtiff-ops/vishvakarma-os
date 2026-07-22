/// <reference path="../../three.d.ts" />
import { useMemo } from 'react';
import * as THREE from 'three';
import type { TerrainPatch } from '@/types';
import { PatternStandardMaterial } from '@/components/editor/sceneMaterials';
import { buildTerrainShapePoints, isValidTerrainPolygon } from '@/core/sceneTerrainCatalog';
import { pxToM } from '@/core/sceneVisualCatalog';

function buildExtrudeGeometry(patch: TerrainPatch): THREE.ExtrudeGeometry | null {
  if (patch.elevation <= 0 || !isValidTerrainPolygon(patch.points)) {
    return null;
  }

  const worldPoints = buildTerrainShapePoints(patch);
  const shape = new THREE.Shape();
  worldPoints.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.z);
    else shape.lineTo(point.x, point.z);
  });
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: pxToM(patch.elevation),
    bevelEnabled: false,
  });
}

export function TerrainPatchMesh({ patch }: { patch: TerrainPatch }) {
  const geometry = useMemo(() => buildExtrudeGeometry(patch), [patch]);

  if (!geometry) return null;

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow geometry={geometry}>
      <PatternStandardMaterial pattern="grass" color="#3d7a3d" roughness={0.92} metalness={0.02} repeat={[4, 4]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

export function TerrainMeshes({ terrain = [] }: { terrain?: TerrainPatch[] }) {
  return (
    <>
      {terrain.map((patch) => (
        <TerrainPatchMesh key={patch.id} patch={patch} />
      ))}
    </>
  );
}
