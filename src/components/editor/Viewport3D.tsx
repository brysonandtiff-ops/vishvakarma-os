// 3D Viewport using React Three Fiber — with WebGL error boundary
/// <reference path="../three.d.ts" />
import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode, MutableRefObject, PointerEvent } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, PointerLockControls, ContactShadows, Environment } from '@react-three/drei';
import { ScenePostProcessing, isPostFxPipelineActive } from '@/components/editor/ScenePostProcessing';
import type { Wall, Opening, LightingConfig, FurnitureItem, MepSymbol, LandscapeElement, FixtureItem, Material, TerrainPatch, Room, Staircase, BuildingFloor } from '@/types';
import { FurnitureMesh, LandscapeMesh, SceneFloor, StairMeshes } from '@/components/editor/sceneMeshes';
import { preloadSceneModels } from '@/components/editor/sceneGltfModels';
import { TerrainMeshes } from '@/components/editor/sceneTerrainMeshes';
import { WallSurfaceMaterial } from '@/components/editor/sceneMaterials';
import * as THREE from 'three';
import { Box, AlertTriangle, RefreshCw, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { ORBIT_MODE_MANTRA, WALK_MODE_MANTRA } from '@/editor/editorMantras';
import {
  persistAtmosphereMode,
  readStoredAtmosphereMode,
  resolveDefaultAtmosphereMode,
  type AtmospherePerformanceMode,
} from '@/utils/atmosphereMode';
import {
  atmosphereModeForProfile,
  PERFORMANCE_PROFILE_EVENT,
  type PerformanceProfile,
} from '@/utils/performanceProfile';
import { minTier } from '@/utils/adaptiveFrameGovernor';
import { AdaptiveFrameGovernor } from '@/components/editor/AdaptiveFrameGovernor';
import { RoomVolumeMeshes } from '@/components/editor/sceneRoomMeshes';
import { canvasToWorld, computeSceneOrigin, type SceneOrigin } from '@/core/sceneVisualCatalog';
import { ATMOSPHERE, DOOR, MEP_COLORS, WINDOW } from '@/core/sceneDrawingTokens';
import { HDRI_STUDIO_ARCH } from '@/core/scenePbrCatalog';
import { resolveAmbientIntensity, resolveSunColor } from '@/core/lightingPresets';
import { BatchedWallMeshes, OpeningMarkers, shouldBatchWalls } from '@/components/editor/sceneWallBatch';
import {
  floorElevationMeters,
  filterByFloorIndex,
  filterOpeningsByFloor,
  filterRoomsByFloor,
  filterWallsByFloor,
} from '@/utils/floorHelpers';

// ---------------------------------------------------------------------------
// WebGL capability pre-check
// ---------------------------------------------------------------------------
function detectWebGL(): { supported: boolean; reason?: string } {
  try {
    const canvas = document.createElement('canvas');
    const ctx =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!ctx) {
      return { supported: false, reason: 'WebGL is not available in this browser or environment.' };
    }
    return { supported: true };
  } catch {
    return { supported: false, reason: 'WebGL context creation threw an exception.' };
  }
}

function resolveInitialAtmosphereMode(): AtmospherePerformanceMode {
  return resolveDefaultAtmosphereMode({ storedMode: readStoredAtmosphereMode() });
}

function DemandRenderInvalidator({
  geometryKey,
  atmosphereMode,
  walkMode,
}: {
  geometryKey: number;
  atmosphereMode: AtmospherePerformanceMode;
  walkMode: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [atmosphereMode, geometryKey, invalidate, walkMode]);
  return null;
}

/**
 * Recovers the 3D view after the browser drops the WebGL context.
 *
 * iPad Safari (and Android Chrome under memory pressure, or any PWA resumed
 * from the background) routinely fires `webglcontextlost` and tears down the
 * GPU context. That is an async event on the canvas element — it never throws
 * during React render, so the WebGLErrorBoundary cannot catch it. Without this
 * guard the canvas freezes to a black/blank frame with no way back.
 *
 * Calling `preventDefault()` on the loss event tells the browser it may attempt
 * automatic restoration; on `webglcontextrestored` we `invalidate()` so the
 * demand frameloop repaints the (re-uploaded) scene.
 */
function WebGLContextGuard({
  onLost,
  onRestored,
}: {
  onLost: () => void;
  onRestored: () => void;
}) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (event: Event) => {
      event.preventDefault();
      console.warn('[Viewport3D] WebGL context lost — attempting recovery');
      onLost();
    };

    const handleRestored = () => {
      console.info('[Viewport3D] WebGL context restored');
      onRestored();
      invalidate();
    };

    canvas.addEventListener('webglcontextlost', handleLost, false);
    canvas.addEventListener('webglcontextrestored', handleRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost, false);
      canvas.removeEventListener('webglcontextrestored', handleRestored, false);
    };
  }, [gl, invalidate, onLost, onRestored]);

  return null;
}

const ATMOSPHERE_MODES: Record<
  AtmospherePerformanceMode,
  {
  label: string;
  particleCount: number;
  particleOpacity: number;
  particleSize: number;
  godRays: boolean;
  sacredFloor: boolean;
  fogNear: number;
  fogFar: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  dpr: [number, number];
}
> = {
  standard: {
    label: 'Standard',
    particleCount: 42,
    particleOpacity: 0.18,
    particleSize: 0.032,
    godRays: false,
    sacredFloor: true,
    fogNear: 12,
    fogFar: 30,
    autoRotate: false,
    autoRotateSpeed: 0,
    dpr: [1, 1.25],
  },
  premium: {
    label: 'Premium',
    particleCount: 80,
    particleOpacity: 0.28,
    particleSize: 0.04,
    godRays: true,
    sacredFloor: true,
    fogNear: 9,
    fogFar: 26,
    autoRotate: false,
    autoRotateSpeed: 0,
    dpr: [1, 1.5],
  },
  cinematic: {
    label: 'Cinematic',
    particleCount: 140,
    particleOpacity: 0.36,
    particleSize: 0.048,
    godRays: true,
    sacredFloor: true,
    fogNear: 8,
    fogFar: 28,
    autoRotate: true,
    autoRotateSpeed: 0.24,
    dpr: [1, 1.75],
  },
};

// ---------------------------------------------------------------------------
// WebGL Error Boundary — class component required for componentDidCatch
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message ?? 'Unknown WebGL error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[Viewport3D] WebGL error caught by boundary:', error.message, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Fallback UI — shown when WebGL is unavailable or throws
// ---------------------------------------------------------------------------
function Viewport3DFallback({ reason, onRetry }: { reason: string; onRetry?: () => void }) {
  return (
    <div className="vish-3d-fallback flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="relative flex items-center justify-center">
        <div className="vish-3d-fallback-icon flex h-16 w-16 items-center justify-center rounded-2xl">
          <Box className="h-8 w-8 text-primary/50" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <AlertTriangle className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      <div className="max-w-[220px] space-y-1.5">
        <p className="text-sm font-semibold text-ws-text">3D Preview Unavailable</p>
        <p className="text-xs text-pretty text-ws-text-dim">
          {reason}
        </p>
      </div>

      <div className="vish-3d-fallback-hint rounded-lg px-3 py-2">
        <p className="text-[10px] text-ws-text-dim">
          2D blueprint editor is fully operational
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" className="vish-gold-action h-8 gap-1.5 text-xs" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface Viewport3DProps {
  walls: Wall[];
  openings: Opening[];
  lighting: LightingConfig;
  furniture?: FurnitureItem[];
  materials?: Material[];
  mepSymbols?: MepSymbol[];
  fixtures?: FixtureItem[];
  landscapeElements?: LandscapeElement[];
  terrain?: TerrainPatch[];
  rooms?: Room[];
  staircases?: Staircase[];
  floorMaterial?: string;
  walkMode?: boolean;
  presentationLock?: boolean;
  floors?: BuildingFloor[];
  activeFloorIndex?: number;
  showAllFloorsIn3D?: boolean;
  onShowAllFloorsIn3DChange?: (value: boolean) => void;
  manifestWalls?: Wall[];
  manifestOpenings?: Opening[];
  manifestRooms?: Room[];
  manifestFurniture?: FurnitureItem[];
  manifestMepSymbols?: MepSymbol[];
  manifestFixtures?: FixtureItem[];
  manifestStaircases?: Staircase[];
  geometryRevision?: number;
}

function MepMarker({ symbol, origin }: { symbol: MepSymbol; origin: SceneOrigin }) {
  const { x, z } = canvasToWorld(symbol.position, origin);
  const color = MEP_COLORS[symbol.type];

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh position={[x, 0.08, z]}>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <sphereGeometry args={[0.08, 12, 12]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

function FixtureLight({ fixture, origin }: { fixture: FixtureItem; origin: SceneOrigin }) {
  const { x, z } = canvasToWorld(fixture.position, origin);
  const intensity = (fixture.intensity ?? 1) * 0.65;
  const warm = '#D4AF37';
  const height = fixture.type === 'ceiling' ? 2.4 : fixture.type === 'spot' ? 2.35 : 2.1;

  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[x, height, z]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.07, 10, 10]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={warm} emissive={warm} emissiveIntensity={0.45} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {fixture.type === 'spot' ? (
        // @ts-expect-error - React Three Fiber JSX types
        <spotLight
          position={[x, height, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          angle={0.55}
          penumbra={0.4}
          intensity={intensity}
          color={warm}
          distance={12}
          castShadow
        />
      ) : (
        // @ts-expect-error - React Three Fiber JSX types
        <pointLight position={[x, height, z]} intensity={intensity} color={warm} distance={fixture.type === 'ceiling' ? 14 : 10} />
      )}
    </>
  );
}

function WallMesh({
  wall,
  openings,
  customMaterials = [],
  origin,
  ghost = false,
}: {
  wall: Wall;
  openings: Opening[];
  customMaterials?: Material[];
  origin: SceneOrigin;
  ghost?: boolean;
}) {
  const length = Math.sqrt(
    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
  );
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const centerX = (wall.start.x + wall.end.x) / 2;
  const centerY = (wall.start.y + wall.end.y) / 2;

  const posX = (centerX - origin.cx) / 100;
  const posZ = (centerY - origin.cy) / 100;
  const posY = wall.height / 200; // Half height

  // Get openings for this wall
  const wallOpenings = openings.filter((o) => o.wallId === wall.id);

  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh
        position={[posX, posY, posZ]}
        rotation={[0, -angle, 0]}
        castShadow
        receiveShadow
      >
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[length / 100, wall.height / 100, wall.thickness / 100]} />
        <WallSurfaceMaterial
          materialId={wall.material}
          customMaterials={customMaterials}
          ghost={ghost}
        />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* Edge highlight for wall extrusion */}
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[posX, posY, posZ]} rotation={[0, -angle, 0]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[length / 100 + 0.004, wall.height / 100 + 0.004, wall.thickness / 100 + 0.004]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshBasicMaterial color={ATMOSPHERE.gridPrimary} wireframe transparent opacity={ghost ? 0.04 : 0.08} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      
      {/* Render openings as colored markers */}
      {wallOpenings.map((opening) => {
        const openingPosX = posX + ((opening.position - 0.5) * length / 100) * Math.cos(-angle);
        const openingPosZ = posZ + ((opening.position - 0.5) * length / 100) * Math.sin(-angle);
        const openingPosY = opening.type === 'door' ? opening.height / 200 : (opening.sillHeight || 90) / 100 + opening.height / 200;
        
        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={opening.id} position={[openingPosX, openingPosY, openingPosZ]} rotation={[0, -angle, 0]}>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <mesh>
              {/* @ts-expect-error - React Three Fiber JSX types */}
              <boxGeometry args={[opening.width / 100, opening.height / 100, wall.thickness / 100 + 0.02]} />
              {/* @ts-expect-error - React Three Fiber JSX types */}
                <meshStandardMaterial
                color={opening.type === 'door' ? DOOR : WINDOW}
                transparent
                opacity={opening.type === 'door' ? 0.35 : 0.48}
                roughness={opening.type === 'door' ? 0.62 : 0.08}
                metalness={opening.type === 'door' ? 0.05 : 0.02}
                emissive={opening.type === 'door' ? '#3a100d' : '#392400'}
                emissiveIntensity={0.14}
              />
              {/* @ts-expect-error - React Three Fiber JSX types */}
            </mesh>
            {opening.type === 'door' ? (
              // @ts-expect-error - React Three Fiber JSX types
              <mesh position={[opening.width / 200, 0, wall.thickness / 200 + 0.01]} rotation={[0, 0.35, 0]}>
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <boxGeometry args={[opening.width / 100, opening.height / 100, 0.03]} />
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <meshStandardMaterial color={DOOR} roughness={0.6} metalness={0.05} />
                {/* @ts-expect-error - React Three Fiber JSX types */}
              </mesh>
            ) : (
              // @ts-expect-error - React Three Fiber JSX types
              <mesh position={[0, 0, 0]}>
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <boxGeometry args={[opening.width / 100 - 0.04, opening.height / 100 - 0.04, 0.01]} />
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <meshStandardMaterial
                  color={WINDOW}
                  transparent
                  opacity={0.42}
                  roughness={0.08}
                  metalness={0.02}
                />
                {/* @ts-expect-error - React Three Fiber JSX types */}
              </mesh>
            )}
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}

function SceneContactShadows({ mode }: { mode: AtmospherePerformanceMode }) {
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mode === 'standard' || reducedMotion) return null;

  return (
    <ContactShadows
      opacity={mode === 'cinematic' ? 0.58 : 0.48}
      scale={24}
      blur={2.4}
      far={8}
      resolution={mode === 'cinematic' ? 512 : 256}
      color={ATMOSPHERE.fog}
    />
  );
}

function SacredFloorGeometry({ mode }: { mode: AtmospherePerformanceMode }) {
  const floorRef = useRef<THREE.Group | null>(null);
  const ringRadii = mode === 'standard' ? [3.6, 7.2] : mode === 'premium' ? [2.4, 4.8, 7.2] : [2.4, 4.8, 7.2, 9.6];
  const radialRotations = mode === 'standard' ? [0, Math.PI / 2] : [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4];

  useFrame((state) => {
    if (!floorRef.current) return;
    floorRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * (mode === 'standard' ? 0.006 : 0.015);
  });

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group ref={floorRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {ringRadii.map((radius, index) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={radius} position={[0, 0, 0.002 + index * 0.001]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <ringGeometry args={[radius - 0.012, radius, mode === 'standard' ? 96 : 192]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color="#D9A72C" transparent opacity={0.065 - index * 0.008} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {radialRotations.map((rotation) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={rotation} rotation={[0, 0, rotation]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <planeGeometry args={[0.018, mode === 'standard' ? 14 : 18]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color="#F5D76A" transparent opacity={mode === 'standard' ? 0.026 : 0.045} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

function AtmosphericParticles({ mode }: { mode: AtmospherePerformanceMode }) {
  const config = ATMOSPHERE_MODES[mode];
  const pointsRef = useRef<THREE.Points | null>(null);
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(config.particleCount * 3);

    for (let index = 0; index < config.particleCount; index += 1) {
      const orbit = index * 1.618;
      const radius = 2.4 + ((index * 37) % 100) / 100 * 8.4;
      positions[index * 3] = Math.cos(orbit) * radius;
      positions[index * 3 + 1] = 0.5 + ((index * 19) % 100) / 100 * 4.8;
      positions[index * 3 + 2] = Math.sin(orbit) * radius;
    }

    return positions;
  }, [config.particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * (mode === 'cinematic' ? 0.026 : 0.018);
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.32) * (mode === 'standard' ? 0.04 : 0.08);
  });

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <points ref={pointsRef}>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <bufferGeometry>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </bufferGeometry>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <pointsMaterial color={ATMOSPHERE.particle} size={config.particleSize} transparent opacity={config.particleOpacity} sizeAttenuation depthWrite={false} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </points>
  );
}

function GodRayShafts({ mode, boostCinematic }: { mode: AtmospherePerformanceMode; boostCinematic?: boolean }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const rayPositions = mode === 'cinematic' ? [-4.2, -1.4, 1.4, 4.2] : [-3.2, 0, 3.2];
  const opacityBase = mode === 'cinematic' ? (boostCinematic ? 0.11 : 0.07) : 0.055;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {rayPositions.map((x, index) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={x} position={[x, 0.2, -2 - index * 0.55]} rotation={[0.35, 0, -0.2 + index * 0.13]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <planeGeometry args={[mode === 'cinematic' ? 1.55 : 1.35, mode === 'cinematic' ? 8 : 7]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color={ATMOSPHERE.godRay} transparent opacity={opacityBase} depthWrite={false} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

function SacredAtmosphere({ mode, boostCinematic }: { mode: AtmospherePerformanceMode; boostCinematic?: boolean }) {
  const config = ATMOSPHERE_MODES[mode];

  return (
    <>
      {config.sacredFloor && <SacredFloorGeometry mode={mode} />}
      <AtmosphericParticles mode={mode} />
      {config.godRays && <GodRayShafts mode={mode} boostCinematic={boostCinematic} />}
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <fog attach="fog" args={[ATMOSPHERE.fog, config.fogNear, config.fogFar]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <hemisphereLight args={[ATMOSPHERE.fillWarm, ATMOSPHERE.fog, mode === 'standard' ? 0.44 : mode === 'premium' ? 0.54 : 0.6]} />
    </>
  );
}

function RendererSetup({
  mode,
  postFxActive,
}: {
  mode: AtmospherePerformanceMode;
  postFxActive: boolean;
}) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = postFxActive ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = mode === 'cinematic' ? 1.12 : mode === 'premium' ? 1.02 : 0.98;
    gl.shadowMap.type = mode !== 'standard' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
  }, [gl, mode, postFxActive]);

  return null;
}

function SceneEnvironment({ mode }: { mode: AtmospherePerformanceMode }) {
  if (mode === 'standard') return null;

  return (
    <Environment
      files={HDRI_STUDIO_ARCH}
      background={false}
      environmentIntensity={mode === 'cinematic' ? 0.82 : 0.52}
    />
  );
}

function Lighting({ lighting, mode }: { lighting: LightingConfig; mode: AtmospherePerformanceMode }) {
  const castShadow = mode !== 'standard';
  const shadowMap = mode === 'cinematic' ? 2048 : 1024;
  const azimuthRad = (lighting.sunAzimuth * Math.PI) / 180;
  const elevationRad = (lighting.sunElevation * Math.PI) / 180;

  const distance = 10;
  const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
  const y = distance * Math.sin(elevationRad);
  const z = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
  const sunColor = resolveSunColor(lighting.timeOfDay, lighting.sunElevation);
  const ambientIntensity = resolveAmbientIntensity(mode, lighting.timeOfDay, lighting.sunElevation);

  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <ambientLight intensity={ambientIntensity} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <directionalLight
        position={[x, y, z]}
        intensity={lighting.intensity}
        color={sunColor}
        castShadow={castShadow}
        shadow-mapSize-width={shadowMap}
        shadow-mapSize-height={shadowMap}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      {mode !== 'standard' && (
        <>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <pointLight position={[-4, 3.2, 3.5]} color={ATMOSPHERE.accentWarm} intensity={mode === 'cinematic' ? 0.52 : 0.46} distance={12} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <pointLight position={[4.5, 1.4, -4]} color={ATMOSPHERE.accentCool} intensity={mode === 'cinematic' ? 0.26 : 0.2} distance={10} />
        </>
      )}
    </>
  );
}

function TouchWalkRig({ moveRef }: { moveRef: MutableRefObject<{ x: number; z: number }> }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const { x, z } = moveRef.current;
    if (x === 0 && z === 0) return;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const motion = forward.multiplyScalar(-z).add(right.multiplyScalar(x));
    camera.position.add(motion.multiplyScalar(2.8 * delta));
  });

  return null;
}

function BuildingSceneLayers({
  walls,
  openings,
  furniture,
  materials,
  mepSymbols,
  fixtures,
  landscapeElements,
  terrain,
  rooms,
  staircases,
  floorMaterial,
  floors = [],
  activeFloorIndex = 0,
  showAllFloorsIn3D = true,
  manifestWalls,
  manifestOpenings,
  manifestRooms,
  manifestFurniture,
  manifestMepSymbols,
  manifestFixtures,
  manifestStaircases,
  atmosphereMode = 'premium',
}: {
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
  materials: Material[];
  mepSymbols: MepSymbol[];
  fixtures: FixtureItem[];
  landscapeElements: LandscapeElement[];
  terrain: TerrainPatch[];
  rooms: Room[];
  staircases: Staircase[];
  floorMaterial: string;
  floors?: BuildingFloor[];
  activeFloorIndex?: number;
  showAllFloorsIn3D?: boolean;
  manifestWalls?: Wall[];
  manifestOpenings?: Opening[];
  manifestRooms?: Room[];
  manifestFurniture?: FurnitureItem[];
  manifestMepSymbols?: MepSymbol[];
  manifestFixtures?: FixtureItem[];
  manifestStaircases?: Staircase[];
  atmosphereMode?: AtmospherePerformanceMode;
}) {
  const allWalls = manifestWalls ?? walls;
  const sceneOrigin = useMemo(
    () => computeSceneOrigin(allWalls.length > 0 ? allWalls : walls),
    [allWalls, walls],
  );

  const useStack =
    showAllFloorsIn3D &&
    floors.length > 1 &&
    manifestWalls &&
    manifestWalls.length > 0;

  if (!useStack) {
    const batchWalls = shouldBatchWalls(walls.length, atmosphereMode);
    const castShadow = atmosphereMode !== 'standard';

    return (
      <>
        <SceneFloor floorMaterial={floorMaterial} customMaterials={materials} />
        <TerrainMeshes terrain={terrain} />
        <RoomVolumeMeshes
          rooms={rooms}
          walls={walls}
          origin={sceneOrigin}
          floorMaterial={floorMaterial}
          atmosphereMode={atmosphereMode}
        />
        <StairMeshes staircases={staircases} origin={sceneOrigin} />
        {batchWalls ? (
          <>
            <BatchedWallMeshes
              walls={walls}
              customMaterials={materials}
              origin={sceneOrigin}
              castShadow={castShadow}
            />
            <OpeningMarkers walls={walls} openings={openings} origin={sceneOrigin} />
          </>
        ) : (
          walls.map((wall) => (
            <WallMesh
              key={wall.id}
              wall={wall}
              openings={openings}
              customMaterials={materials}
              origin={sceneOrigin}
            />
          ))
        )}
        {furniture.map((item) => (
          <FurnitureMesh key={item.id} item={item} origin={sceneOrigin} />
        ))}
        {mepSymbols.map((symbol) => (
          <MepMarker key={symbol.id} symbol={symbol} origin={sceneOrigin} />
        ))}
        {fixtures.map((fixture) => (
          <FixtureLight key={fixture.id} fixture={fixture} origin={sceneOrigin} />
        ))}
        {landscapeElements.map((element) => (
          <LandscapeMesh key={element.id} element={element} origin={sceneOrigin} />
        ))}
      </>
    );
  }

  const sortedFloorIndices = floors
    .map((_, index) => index)
    .sort((a, b) => {
      if (a === activeFloorIndex) return -1;
      if (b === activeFloorIndex) return 1;
      return a - b;
    })
    .slice(0, 4);

  const allOpenings = manifestOpenings ?? openings;
  const allRooms = manifestRooms ?? rooms;
  const allFurniture = manifestFurniture ?? furniture;
  const allMep = manifestMepSymbols ?? mepSymbols;
  const allFixtures = manifestFixtures ?? fixtures;
  const allStairs = manifestStaircases ?? staircases;

  return (
    <>
      <SceneFloor floorMaterial={floorMaterial} customMaterials={materials} />
      <TerrainMeshes terrain={terrain} />
      {landscapeElements.map((element) => (
        <LandscapeMesh key={element.id} element={element} origin={sceneOrigin} />
      ))}
      {sortedFloorIndices.map((floorIndex) => {
        const floor = floors[floorIndex];
        const isActive = floorIndex === activeFloorIndex;
        const yOffset = floorElevationMeters(floor.elevation);
        const floorWalls = filterWallsByFloor(manifestWalls!, floorIndex);
        const floorOpenings = filterOpeningsByFloor(allOpenings, manifestWalls!, floorIndex);
        const floorRooms = filterRoomsByFloor(allRooms, floorIndex);
        const floorStairs = filterByFloorIndex(allStairs, floorIndex);
        const floorFurniture = filterByFloorIndex(allFurniture, floorIndex);
        const floorMep = filterByFloorIndex(allMep, floorIndex);
        const floorFixtures = filterByFloorIndex(allFixtures, floorIndex);

        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={floor.id} position={[0, yOffset, 0]}>
            {isActive && (
              <RoomVolumeMeshes
                rooms={floorRooms}
                walls={floorWalls}
                origin={sceneOrigin}
                floorMaterial={floorMaterial}
                atmosphereMode={atmosphereMode}
              />
            )}
            <StairMeshes staircases={floorStairs} origin={sceneOrigin} />
            {shouldBatchWalls(floorWalls.length, atmosphereMode) ? (
              <>
                <BatchedWallMeshes
                  walls={floorWalls}
                  customMaterials={materials}
                  origin={sceneOrigin}
                  castShadow={atmosphereMode !== 'standard'}
                />
                <OpeningMarkers walls={floorWalls} openings={floorOpenings} origin={sceneOrigin} />
              </>
            ) : (
              floorWalls.map((wall) => (
                <WallMesh
                  key={wall.id}
                  wall={wall}
                  openings={floorOpenings}
                  customMaterials={materials}
                  origin={sceneOrigin}
                  ghost={!isActive}
                />
              ))
            )}
            {isActive &&
              floorFurniture.map((item) => (
                <FurnitureMesh key={item.id} item={item} origin={sceneOrigin} />
              ))}
            {isActive &&
              floorMep.map((symbol) => (
                <MepMarker key={symbol.id} symbol={symbol} origin={sceneOrigin} />
              ))}
            {isActive &&
              floorFixtures.map((fixture) => (
                <FixtureLight key={fixture.id} fixture={fixture} origin={sceneOrigin} />
              ))}
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}

export default function Viewport3D({
  walls,
  openings,
  lighting,
  furniture = [],
  materials = [],
  mepSymbols = [],
  fixtures = [],
  landscapeElements = [],
  terrain = [],
  rooms = [],
  staircases = [],
  floorMaterial = 'material-concrete',
  walkMode = false,
  presentationLock = false,
  floors = [],
  activeFloorIndex = 0,
  showAllFloorsIn3D = true,
  onShowAllFloorsIn3DChange,
  manifestWalls,
  manifestOpenings,
  manifestRooms,
  manifestFurniture,
  manifestMepSymbols,
  manifestFixtures,
  manifestStaircases,
  geometryRevision = 0,
}: Viewport3DProps) {
  const isCoarsePointer = useCoarsePointer();
  const touchMoveRef = useRef({ x: 0, z: 0 });
  const allWallsForOrigin = manifestWalls ?? walls;
  const sceneOrigin = useMemo(
    () => computeSceneOrigin(allWallsForOrigin.length > 0 ? allWallsForOrigin : walls),
    [allWallsForOrigin, walls],
  );
  const [atmosphereMode, setAtmosphereModeState] = useState<AtmospherePerformanceMode>(resolveInitialAtmosphereMode);
  const [penPointerActive, setPenPointerActive] = useState(false);
  // Adaptive FPS governor: caps the effective tier below the user's choice when
  // measured frame time shows the device can't hold a smooth rate. null = no cap.
  const [adaptiveCap, setAdaptiveCap] = useState<AtmospherePerformanceMode | null>(null);
  // WebGL context-loss recovery state (iPad Safari / backgrounded PWA / GPU reset).
  const [contextLost, setContextLost] = useState(false);
  const [canvasGeneration, setCanvasGeneration] = useState(0);

  const handleContextLost = useCallback(() => setContextLost(true), []);
  const handleContextRestored = useCallback(() => setContextLost(false), []);
  const handleManualRestore = useCallback(() => {
    setContextLost(false);
    // Force a fresh Canvas mount so a brand-new WebGL context is created when
    // the browser never fires `webglcontextrestored` on its own.
    setCanvasGeneration((generation) => generation + 1);
  }, []);
  const setAtmosphereMode = (mode: AtmospherePerformanceMode) => {
    setAtmosphereModeState(mode);
    persistAtmosphereMode(mode);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const profile = (event as CustomEvent<PerformanceProfile>).detail;
      setAtmosphereModeState(atmosphereModeForProfile(profile));
    };
    window.addEventListener(PERFORMANCE_PROFILE_EVENT, handler);
    return () => window.removeEventListener(PERFORMANCE_PROFILE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!walkMode || !isCoarsePointer) {
      touchMoveRef.current = { x: 0, z: 0 };
    }
  }, [walkMode, isCoarsePointer]);

  const baseAtmosphereMode: AtmospherePerformanceMode =
    walkMode && isCoarsePointer ? 'standard' : atmosphereMode;

  // The governor never raises quality above the user's chosen tier — it only
  // caps downward for smoothness. Every GPU cost knob (DPR, shadows, antialias,
  // particles, god rays, environment, post-FX) is wired to this value, so a
  // single cap scales the whole scene's cost up and down with real frame time.
  const effectiveAtmosphereMode: AtmospherePerformanceMode = minTier(
    baseAtmosphereMode,
    adaptiveCap ?? baseAtmosphereMode,
  );

  // A manual tier change (or walk-mode transition) is fresh user intent — drop
  // any adaptive cap so the chosen quality shows immediately; the governor then
  // re-evaluates from the new ceiling.
  useEffect(() => {
    setAdaptiveCap(null);
  }, [atmosphereMode, walkMode, isCoarsePointer]);

  const cinematicBoost = effectiveAtmosphereMode === 'cinematic' && !isCoarsePointer;

  const atmosphereConfig = ATMOSPHERE_MODES[effectiveAtmosphereMode];

  const setTouchMove = (x: number, z: number) => {
    touchMoveRef.current = { x, z };
  };

  const handlePenPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'pen') setPenPointerActive(true);
  };

  const handlePenPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'pen') setPenPointerActive(false);
  };

  useEffect(() => {
    preloadSceneModels();
  }, []);

  // Pre-check: avoid mounting Canvas at all if WebGL is unsupported
  const webgl = detectWebGL();
  if (!webgl.supported) {
    return (
      <div className="flex h-full w-full flex-col">
        <Viewport3DHeader wallCount={0} atmosphereMode={atmosphereMode} />
        <div className="flex-1 bg-muted">
          <Viewport3DFallback reason={webgl.reason ?? 'WebGL is not supported.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Viewport3DHeader wallCount={walls.length} atmosphereMode={atmosphereMode} />
      <div
        className="relative flex-1 overflow-hidden bg-[var(--vish-3d-bg)]"
        onPointerDown={handlePenPointerDown}
        onPointerUp={handlePenPointerUp}
        onPointerCancel={handlePenPointerUp}
      >
        <WebGLErrorBoundary
          fallback={
            <Viewport3DFallback reason="WebGL context creation failed (BindToCurrentSequence). The 3D renderer could not initialise." />
          }
        >
          <Canvas
            key={canvasGeneration}
            frameloop={walkMode ? 'always' : 'demand'}
            shadows={effectiveAtmosphereMode !== 'standard'}
            dpr={atmosphereConfig.dpr}
            gl={{ antialias: effectiveAtmosphereMode !== 'standard', alpha: false, powerPreference: effectiveAtmosphereMode === 'cinematic' ? 'high-performance' : 'default' }}
            style={{ width: '100%', height: '100%' }}
          >
            <WebGLContextGuard onLost={handleContextLost} onRestored={handleContextRestored} />
            <AdaptiveFrameGovernor ceiling={baseAtmosphereMode} onCapChange={setAdaptiveCap} />
            <DemandRenderInvalidator
              geometryKey={geometryRevision}
              atmosphereMode={effectiveAtmosphereMode}
              walkMode={walkMode}
            />
            <RendererSetup
              mode={effectiveAtmosphereMode}
              postFxActive={isPostFxPipelineActive(
                effectiveAtmosphereMode,
                allWallsForOrigin.length,
                cinematicBoost && !presentationLock && !walkMode,
              )}
            />
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <color attach="background" args={[ATMOSPHERE.background]} />
            <PerspectiveCamera makeDefault position={[8, 6, 8]} />
            <SceneEnvironment mode={effectiveAtmosphereMode} />
            {walkMode && isCoarsePointer ? (
              <>
                <OrbitControls
                  enableDamping
                  dampingFactor={0.08}
                  enablePan={false}
                  enableRotate={!penPointerActive}
                  enableZoom
                  minDistance={2}
                  maxDistance={24}
                  target={[sceneOrigin.cx / 100, 1.6, sceneOrigin.cy / 100]}
                  touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY }}
                />
                <TouchWalkRig moveRef={touchMoveRef} />
              </>
            ) : walkMode && !isCoarsePointer ? (
              <PointerLockControls selector="#vish-3d-walk-hint" />
            ) : (
              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                enablePan
                enableRotate={!penPointerActive}
                enableZoom
                autoRotate={atmosphereConfig.autoRotate}
                autoRotateSpeed={atmosphereConfig.autoRotateSpeed}
                touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
              />
            )}

            <Lighting lighting={lighting} mode={effectiveAtmosphereMode} />
            <SacredAtmosphere mode={effectiveAtmosphereMode} boostCinematic={cinematicBoost} />
            <SceneContactShadows mode={effectiveAtmosphereMode} />

            <BuildingSceneLayers
              walls={walls}
              openings={openings}
              furniture={furniture}
              materials={materials}
              mepSymbols={mepSymbols}
              fixtures={fixtures}
              landscapeElements={landscapeElements}
              terrain={terrain}
              rooms={rooms}
              staircases={staircases}
              floorMaterial={floorMaterial}
              floors={floors}
              activeFloorIndex={activeFloorIndex}
              showAllFloorsIn3D={showAllFloorsIn3D}
              manifestWalls={manifestWalls}
              manifestOpenings={manifestOpenings}
              manifestRooms={manifestRooms}
              manifestFurniture={manifestFurniture}
              manifestMepSymbols={manifestMepSymbols}
              manifestFixtures={manifestFixtures}
              manifestStaircases={manifestStaircases}
              atmosphereMode={effectiveAtmosphereMode}
            />

            <ScenePostProcessing
              mode={effectiveAtmosphereMode}
              wallCount={allWallsForOrigin.length}
              enabled={cinematicBoost && !presentationLock && !walkMode}
            />

            {/* @ts-expect-error - React Three Fiber JSX types */}
            <gridHelper args={[20, 20, ATMOSPHERE.gridPrimary, ATMOSPHERE.gridSecondary]} />
          </Canvas>
        </WebGLErrorBoundary>

        {contextLost && (
          <div className="vish-3d-context-lost absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            </div>
            <div className="max-w-[240px] space-y-1">
              <p className="text-sm font-semibold text-ws-text">Restoring 3D view…</p>
              <p className="text-xs text-pretty text-ws-text-dim">
                The graphics context was reset by your device. Your design is safe — the 2D editor stays fully usable.
              </p>
            </div>
            <Button variant="outline" size="sm" className="vish-gold-action h-8 gap-1.5 text-xs" onClick={handleManualRestore}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reload 3D view
            </Button>
          </div>
        )}

        {walkMode && (
          <p
            id="vish-3d-walk-hint"
            className="absolute bottom-3 left-3 rounded-lg border border-primary/30 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wider text-primary"
          >
            {isCoarsePointer ? 'Drag to look · use pad to move' : 'Click canvas to enter walk · Esc to exit'}
            <span className="font-devanagari ml-1 text-primary/70">· {WALK_MODE_MANTRA}</span>
          </p>
        )}
        {walkMode && isCoarsePointer && (
          <div className="absolute bottom-16 left-3 grid grid-cols-3 gap-1 rounded-xl border border-primary/25 bg-black/45 p-1 touch-none backdrop-blur-md">
            <span />
            <button
              type="button"
              className="touch-target rounded-lg bg-white/10 px-3 py-2 text-xs text-primary"
              onPointerDown={() => setTouchMove(0, 1)}
              onPointerUp={() => setTouchMove(0, 0)}
              onPointerLeave={() => setTouchMove(0, 0)}
            >
              ↑
            </button>
            <span />
            <button
              type="button"
              className="touch-target rounded-lg bg-white/10 px-3 py-2 text-xs text-primary"
              onPointerDown={() => setTouchMove(-1, 0)}
              onPointerUp={() => setTouchMove(0, 0)}
              onPointerLeave={() => setTouchMove(0, 0)}
            >
              ←
            </button>
            <button
              type="button"
              className="touch-target rounded-lg bg-white/10 px-3 py-2 text-xs text-primary"
              onPointerDown={() => setTouchMove(0, -1)}
              onPointerUp={() => setTouchMove(0, 0)}
              onPointerLeave={() => setTouchMove(0, 0)}
            >
              ↓
            </button>
            <button
              type="button"
              className="touch-target rounded-lg bg-white/10 px-3 py-2 text-xs text-primary"
              onPointerDown={() => setTouchMove(1, 0)}
              onPointerUp={() => setTouchMove(0, 0)}
              onPointerLeave={() => setTouchMove(0, 0)}
            >
              →
            </button>
          </div>
        )}
        {/* Atmosphere mode controls */}
        {!presentationLock && onShowAllFloorsIn3DChange && floors.length > 1 && (
          <div className="absolute left-3 top-3 rounded-xl border border-primary/20 bg-black/40 px-2 py-1.5 shadow-2xl backdrop-blur-md">
            <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <input
                type="checkbox"
                checked={showAllFloorsIn3D}
                onChange={(e) => onShowAllFloorsIn3DChange(e.target.checked)}
                className="h-3 w-3 accent-primary"
              />
              Stack floors
            </label>
          </div>
        )}
        {!presentationLock && (
        <div className="absolute right-3 top-3 space-y-2 text-right">
          <div className="rounded-xl border border-primary/25 bg-black/35 px-3 py-2 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">
              <Sparkles className="h-3 w-3" /> Architect Energy
            </div>
            <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {atmosphereConfig.label} · {atmosphereMode === 'standard' ? 'low power' : atmosphereMode === 'premium' ? 'balanced' : 'max visuals'}
            </p>
          </div>
          <div className="pointer-events-auto flex justify-end gap-1 rounded-xl border border-primary/20 bg-black/40 p-1 shadow-2xl backdrop-blur-md">
            {(Object.keys(ATMOSPHERE_MODES) as AtmospherePerformanceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAtmosphereMode(mode)}
                className={`vish-3d-atmosphere-btn touch-target rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition ${
                  atmosphereMode === mode
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {ATMOSPHERE_MODES[mode].label}
              </button>
            ))}
          </div>
        </div>
        )}

        {!walkMode && (
        <div className="vish-3d-orbit-hint pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md px-2 py-1">
          <RotateCcw className="h-2.5 w-2.5 text-ws-text-faint" />
          <span className="text-[9px] tracking-wide text-ws-text-faint">
            Drag to orbit · {isCoarsePointer ? 'Pinch to zoom' : 'Scroll to zoom'} · {atmosphereConfig.label} atmosphere
            <span className="font-devanagari ml-1 text-primary/60">· {ORBIT_MODE_MANTRA}</span>
          </span>
        </div>
        )}
      </div>
    </div>
  );
}

// ── Premium 3D Viewport Header ──────────────────────────────────────────────
function Viewport3DHeader({ wallCount, atmosphereMode }: { wallCount: number; atmosphereMode: AtmospherePerformanceMode }) {
  return (
    <div className="vish-3d-viewport-header flex h-7 shrink-0 items-center gap-2 px-3">
      <div className="flex items-center gap-1.5">
        <Box className="h-3 w-3 text-ws-active" />
        <span className="vish-3d-viewport-header-label">Sacred 3D View</span>
      </div>

      <div className="flex-1" />

      <div className="vish-3d-badge vish-3d-badge-gold flex items-center gap-1 rounded px-1.5 py-0.5">
        <Layers className="h-2.5 w-2.5 text-ws-active" />
        <span className="font-mono text-[9px] text-ws-active">
          {wallCount} wall{wallCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="vish-3d-badge vish-3d-badge-muted rounded px-1.5 py-0.5">
        <span className="text-[9px] tracking-wide text-ws-text-faint">
          WebGL · {ATMOSPHERE_MODES[atmosphereMode].label}
        </span>
      </div>
    </div>
  );
}
