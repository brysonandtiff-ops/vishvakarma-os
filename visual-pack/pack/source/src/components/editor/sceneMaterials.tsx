/// <reference path="../../three.d.ts" />
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Material } from '@/types';
import {
  createPatternCanvas,
  createProceduralNormalCanvas,
  type PatternKey,
} from '@/core/texturePatterns';
import {
  getPbrBundleForMaterialType,
  getPbrBundleForPreset,
  GLASS_SURFACE,
  pbrTextureUrl,
  type PbrBundleConfig,
} from '@/core/scenePbrCatalog';
import { MATERIAL_PRESETS, getMaterialVisual } from '@/components/editor/MaterialPicker';

const textureCache = new Map<string, THREE.CanvasTexture>();
const patternCache = new Map<PatternKey, THREE.CanvasTexture>();
const normalCache = new Map<PatternKey, THREE.CanvasTexture>();

function configureRepeat(texture: THREE.Texture, repeat: [number, number]) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
}

function getCachedPatternTexture(key: PatternKey): THREE.CanvasTexture | null {
  if (patternCache.has(key)) return patternCache.get(key)!;
  const canvas = createPatternCanvas(key);
  if (!canvas) return null;
  const texture = new THREE.CanvasTexture(canvas);
  configureRepeat(texture, [4, 4]);
  texture.colorSpace = THREE.SRGBColorSpace;
  patternCache.set(key, texture);
  return texture;
}

function getCachedNormalTexture(key: PatternKey): THREE.CanvasTexture | null {
  if (normalCache.has(key)) return normalCache.get(key)!;
  const canvas = createProceduralNormalCanvas(key);
  if (!canvas) return null;
  const texture = new THREE.CanvasTexture(canvas);
  configureRepeat(texture, [4, 4]);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  normalCache.set(key, texture);
  return texture;
}

export function usePatternTexture(key: PatternKey, repeat: [number, number] = [4, 4]) {
  return useMemo(() => {
    const texture = getCachedPatternTexture(key);
    if (texture) texture.repeat.set(repeat[0], repeat[1]);
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
  alphaMap,
  normalMap,
}: {
  pattern: PatternKey;
  color?: string;
  roughness?: number;
  metalness?: number;
  repeat?: [number, number];
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
}) {
  const map = usePatternTexture(pattern, repeat);
  const proceduralNormal = useMemo(
    () => normalMap ?? getCachedNormalTexture(pattern),
    [normalMap, pattern],
  );

  if (proceduralNormal && !normalMap) {
    proceduralNormal.repeat.set(repeat[0], repeat[1]);
  }

  if (!map) {
    return (
      // @ts-expect-error - React Three Fiber JSX types
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={transparent}
        opacity={opacity}
        alphaMap={alphaMap ?? undefined}
        normalMap={proceduralNormal ?? undefined}
        normalScale={proceduralNormal ? new THREE.Vector2(0.35, 0.35) : undefined}
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
      alphaMap={alphaMap ?? undefined}
      normalMap={proceduralNormal ?? undefined}
      normalScale={proceduralNormal ? new THREE.Vector2(0.35, 0.35) : undefined}
    />
  );
}

function BundledPbrMapsMaterial({
  bundle,
  color = '#ffffff',
  roughness,
  metalness,
  repeat,
  transparent = false,
  opacity = 1,
  alphaMap,
}: {
  bundle: PbrBundleConfig;
  color?: string;
  roughness?: number;
  metalness?: number;
  repeat?: [number, number];
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | null;
}) {
  const tileRepeat = repeat ?? bundle.repeat;
  const [colorMap, normalMap, roughnessMap] = useTexture([
    pbrTextureUrl(bundle.folder, 'color'),
    pbrTextureUrl(bundle.folder, 'normal'),
    pbrTextureUrl(bundle.folder, 'roughness'),
  ]);

  useEffect(() => {
    for (const tex of [colorMap, normalMap, roughnessMap]) {
      configureRepeat(tex, tileRepeat);
    }
    colorMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
  }, [colorMap, normalMap, roughnessMap, tileRepeat]);

  if (bundle.physical) {
    return (
      // @ts-expect-error - React Three Fiber JSX types
      <meshPhysicalMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        color={color}
        roughness={roughness ?? bundle.roughness}
        metalness={metalness ?? bundle.metalness}
        transparent={transparent}
        opacity={opacity}
        transmission={bundle.transmission ?? 0.55}
        ior={bundle.ior ?? 1.33}
        alphaMap={alphaMap ?? undefined}
      />
    );
  }

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <meshStandardMaterial
      map={colorMap}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      color={color}
      roughness={roughness ?? bundle.roughness}
      metalness={metalness ?? bundle.metalness}
      transparent={transparent}
      opacity={opacity}
      alphaMap={alphaMap ?? undefined}
    />
  );
}

class PbrTextureErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export function PbrSurfaceMaterial({
  bundle,
  color = '#ffffff',
  roughness,
  metalness,
  repeat,
  transparent = false,
  opacity = 1,
  alphaMap,
}: {
  bundle: PbrBundleConfig;
  color?: string;
  roughness?: number;
  metalness?: number;
  repeat?: [number, number];
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | null;
}) {
  const fallback = (
    <PatternStandardMaterial
      pattern={bundle.fallbackPattern}
      color={color}
      roughness={roughness ?? bundle.roughness}
      metalness={metalness ?? bundle.metalness}
      repeat={repeat ?? bundle.repeat}
      transparent={transparent}
      opacity={opacity}
      alphaMap={alphaMap}
    />
  );

  return (
    <PbrTextureErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <BundledPbrMapsMaterial
          bundle={bundle}
          color={color}
          roughness={roughness}
          metalness={metalness}
          repeat={repeat}
          transparent={transparent}
          opacity={opacity}
          alphaMap={alphaMap}
        />
      </Suspense>
    </PbrTextureErrorBoundary>
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

  if (materialId === 'material-glass') {
    return (
      <PbrSurfaceMaterial
        bundle={GLASS_SURFACE}
        color={visual.color}
        roughness={visual.roughness}
        metalness={visual.metalness}
        transparent
        opacity={0.72}
      />
    );
  }

  const bundle = material?.type
    ? getPbrBundleForMaterialType(material.type)
    : getPbrBundleForPreset(materialId);

  return (
    <PbrSurfaceMaterial
      bundle={bundle}
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

export function ExteriorFloorMaterial({
  floorMaterial: _floorMaterial,
  customMaterials: _customMaterials = [],
}: {
  floorMaterial: string;
  customMaterials?: Material[];
}) {
  const alphaMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const cacheKey = 'exterior-floor-alpha';
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(256, 256, 48, 256, 256, 256);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.62, 'rgba(255,255,255,0.82)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    textureCache.set(cacheKey, texture);
    return texture;
  }, []);

  return (
    <PbrSurfaceMaterial
      bundle={getPbrBundleForMaterialType('grass')}
      color="#4a7c59"
      roughness={0.94}
      metalness={0.02}
      repeat={[8, 8]}
      transparent
      opacity={0.88}
      alphaMap={alphaMap}
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
      <PbrSurfaceMaterial
        bundle={getPbrBundleForMaterialType('grass')}
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

  const bundle = material?.type
    ? getPbrBundleForMaterialType(material.type)
    : getPbrBundleForPreset(floorMaterial);

  return (
    <PbrSurfaceMaterial
      bundle={bundle}
      color={visual.color || '#DCD0B8'}
      roughness={visual.roughness}
      metalness={visual.metalness}
      repeat={[6, 6]}
    />
  );
}
