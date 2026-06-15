/// <reference path="../../three.d.ts" />
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Material } from '@/types';
import {
  createPatternCanvas,
  type PatternKey,
} from '@/core/texturePatterns';
import {
  getPatternForMaterialType,
  getPresetPatternForMaterial,
} from '@/core/sceneTextureCatalog';
import { MATERIAL_PRESETS, getMaterialVisual } from '@/components/editor/MaterialPicker';

const textureCache = new Map<PatternKey, THREE.CanvasTexture>();

function getCachedPatternTexture(key: PatternKey): THREE.CanvasTexture | null {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }
  const canvas = createPatternCanvas(key);
  if (!canvas) return null;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function usePatternTexture(key: PatternKey, repeat: [number, number] = [4, 4]) {
  return useMemo(() => {
    const texture = getCachedPatternTexture(key);
    if (texture) {
      texture.repeat.set(repeat[0], repeat[1]);
    }
    return texture;
  }, [key, repeat[0], repeat[1]]);
}

export function PatternStandardMaterial({
  pattern,
  color = '#ffffff',
  roughness = 0.72,
  metalness = 0.05,
  repeat = [4, 4],
  transparent = false,
  opacity = 1,
}: {
  pattern: PatternKey;
  color?: string;
  roughness?: number;
  metalness?: number;
  repeat?: [number, number];
  transparent?: boolean;
  opacity?: number;
}) {
  const map = usePatternTexture(pattern, repeat);
  if (!map) {
    return (
      // @ts-expect-error - React Three Fiber JSX types
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={transparent}
        opacity={opacity}
      />
    );
  }
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <meshStandardMaterial
      map={map}
      color={color}
      roughness={roughness}
      metalness={metalness}
      transparent={transparent}
      opacity={opacity}
    />
  );
}

function RemoteTexturedMaterial({
  textureUrl,
  color,
  roughness,
  metalness,
}: {
  textureUrl: string;
  color: string;
  roughness: number;
  metalness: number;
}) {
  const texture = useTexture(textureUrl);
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <meshStandardMaterial map={texture} color={color} roughness={roughness} metalness={metalness} />
  );
}

export function WallSurfaceMaterial({
  materialId,
  customMaterials = [],
  ghost = false,
}: {
  materialId: string;
  customMaterials?: Material[];
  ghost?: boolean;
}) {
  const visual = getMaterialVisual(materialId, customMaterials);
  const allMaterials = [...MATERIAL_PRESETS, ...customMaterials];
  const material = allMaterials.find((entry) => entry.id === materialId);

  if (ghost) {
    return (
      // @ts-expect-error - React Three Fiber JSX types
      <meshStandardMaterial
        color={visual.color}
        transparent
        opacity={0.28}
        depthWrite={false}
        roughness={visual.roughness}
        metalness={visual.metalness}
      />
    );
  }

  if (visual.textureUrl) {
    return (
      <RemoteTexturedMaterial
        textureUrl={visual.textureUrl}
        color={visual.color}
        roughness={visual.roughness}
        metalness={visual.metalness}
      />
    );
  }

  const pattern = material?.type
    ? getPatternForMaterialType(material.type)
    : getPresetPatternForMaterial(materialId);

  return (
    <PatternStandardMaterial
      pattern={pattern}
      color={visual.color}
      roughness={visual.roughness}
      metalness={visual.metalness}
      repeat={[3, 2]}
    />
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AnimatedWaterMaterial({
  color = '#1a6baf',
  repeat = [6, 6],
}: {
  color?: string;
  repeat?: [number, number];
}) {
  const normalMap = usePatternTexture('waterNormal', repeat);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const animate = useMemo(() => !prefersReducedMotion(), []);

  useFrame((state) => {
    if (!animate || !materialRef.current?.normalMap) return;
    materialRef.current.normalMap.offset.y = state.clock.elapsedTime * 0.04;
    materialRef.current.normalMap.offset.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.02;
  });

  useEffect(() => {
    if (normalMap) {
      normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    }
  }, [normalMap]);

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <meshPhysicalMaterial
      ref={materialRef}
      color={color}
      transparent
      opacity={0.82}
      transmission={0.55}
      roughness={0.05}
      metalness={0.05}
      thickness={0.2}
      ior={1.33}
      normalMap={normalMap ?? undefined}
      normalScale={normalMap ? new THREE.Vector2(0.25, 0.25) : undefined}
    />
  );
}

export function FloorSurfaceMaterial({
  floorMaterial,
  customMaterials = [],
  exterior = false,
}: {
  floorMaterial: string;
  customMaterials?: Material[];
  exterior?: boolean;
}) {
  if (exterior) {
    return (
      <PatternStandardMaterial
        pattern="grass"
        color="#4a7c59"
        roughness={0.92}
        metalness={0.02}
        repeat={[8, 8]}
        transparent
        opacity={0.85}
      />
    );
  }

  const visual = getMaterialVisual(floorMaterial, customMaterials);
  const allMaterials = [...MATERIAL_PRESETS, ...customMaterials];
  const material = allMaterials.find((entry) => entry.id === floorMaterial);

  if (visual.textureUrl) {
    return (
      <RemoteTexturedMaterial
        textureUrl={visual.textureUrl}
        color={visual.color}
        roughness={visual.roughness}
        metalness={visual.metalness}
      />
    );
  }

  const pattern = material?.type
    ? getPatternForMaterialType(material.type)
    : getPresetPatternForMaterial(floorMaterial);

  return (
    <PatternStandardMaterial
      pattern={pattern}
      color={visual.color || '#DCD0B8'}
      roughness={visual.roughness}
      metalness={visual.metalness}
      repeat={[6, 6]}
    />
  );
}
