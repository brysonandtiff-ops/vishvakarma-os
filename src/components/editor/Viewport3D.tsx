// 3D Viewport using React Three Fiber — with WebGL error boundary
/// <reference path="../three.d.ts" />
import { Component, useMemo, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { Wall, Opening, LightingConfig } from '@/types';
import * as THREE from 'three';
import { Box, AlertTriangle, RefreshCw, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      {/* Icon cluster */}
      <div className="relative flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Box className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-warning/40 bg-warning/10">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        </div>
      </div>

      {/* Text */}
      <div className="max-w-[220px] space-y-1.5">
        <p className="text-sm font-semibold text-foreground">3D Preview Unavailable</p>
        <p className="text-xs text-pretty text-muted-foreground">
          {reason}
        </p>
      </div>

      {/* Hint */}
      <div className="rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-[10px] text-muted-foreground">
          2D blueprint editor is fully operational
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRetry}>
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
}

function WallMesh({ wall, openings }: { wall: Wall; openings: Opening[] }) {
  const length = Math.sqrt(
    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
  );
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const centerX = (wall.start.x + wall.end.x) / 2;
  const centerY = (wall.start.y + wall.end.y) / 2;

  // Convert 2D canvas coordinates to 3D world coordinates
  const posX = (centerX - 600) / 100; // Center and scale
  const posZ = (centerY - 400) / 100;
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#B5A58F" roughness={0.72} metalness={0.06} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      
      {/* Render openings as colored markers */}
      {wallOpenings.map((opening) => {
        const openingPosX = posX + ((opening.position - 0.5) * length / 100) * Math.cos(-angle);
        const openingPosZ = posZ + ((opening.position - 0.5) * length / 100) * Math.sin(-angle);
        const openingPosY = opening.type === 'door' ? opening.height / 200 : (opening.sillHeight || 90) / 100 + opening.height / 200;
        
        return (
          // @ts-expect-error - React Three Fiber JSX types
          <mesh
            key={opening.id}
            position={[openingPosX, openingPosY, openingPosZ]}
          >
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <boxGeometry args={[opening.width / 100, opening.height / 100, wall.thickness / 100 + 0.02]} />
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <meshStandardMaterial 
              color={opening.type === 'door' ? '#C85A54' : '#D4A13D'}
              transparent 
              opacity={0.74}
              emissive={opening.type === 'door' ? '#3a100d' : '#392400'}
              emissiveIntensity={0.12}
            />
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </mesh>
        );
      })}
    </>
  );
}

function Floor() {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <planeGeometry args={[22, 22]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial color="#DCD0B8" roughness={0.84} metalness={0.03} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

function SacredFloorGeometry() {
  const floorRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!floorRef.current) return;
    floorRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.015;
  });

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group ref={floorRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[2.4, 4.8, 7.2, 9.6].map((radius, index) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={radius} position={[0, 0, 0.002 + index * 0.001]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <ringGeometry args={[radius - 0.012, radius, 192]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color="#D9A72C" transparent opacity={0.07 - index * 0.008} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {[0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4].map((rotation) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={rotation} rotation={[0, 0, rotation]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <planeGeometry args={[0.018, 18]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color="#F5D76A" transparent opacity={0.045} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

function AtmosphericParticles() {
  const pointsRef = useRef<THREE.Points | null>(null);
  const particlePositions = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const orbit = index * 1.618;
      const radius = 2.4 + ((index * 37) % 100) / 100 * 8.4;
      positions[index * 3] = Math.cos(orbit) * radius;
      positions[index * 3 + 1] = 0.5 + ((index * 19) % 100) / 100 * 4.8;
      positions[index * 3 + 2] = Math.sin(orbit) * radius;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.018;
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.32) * 0.08;
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
      <pointsMaterial color="#F4C34F" size={0.045} transparent opacity={0.38} sizeAttenuation depthWrite={false} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </points>
  );
}

function GodRayShafts() {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {[-3.2, 0, 3.2].map((x, index) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={x} position={[x, 0.2, -2 - index * 0.8]} rotation={[0.35, 0, -0.18 + index * 0.18]}>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <planeGeometry args={[1.35, 7]} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshBasicMaterial color="#F5D76A" transparent opacity={0.055} depthWrite={false} side={THREE.DoubleSide} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

function SacredAtmosphere() {
  return (
    <>
      <SacredFloorGeometry />
      <AtmosphericParticles />
      <GodRayShafts />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <fog attach="fog" args={["#17120A", 9, 26]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <hemisphereLight args={["#F2C45A", "#17120A", 0.42]} />
    </>
  );
}

function Lighting({ lighting }: { lighting: LightingConfig }) {
  // Convert azimuth and elevation to 3D position
  const azimuthRad = (lighting.sunAzimuth * Math.PI) / 180;
  const elevationRad = (lighting.sunElevation * Math.PI) / 180;

  const distance = 10;
  const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
  const y = distance * Math.sin(elevationRad);
  const z = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);

  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <ambientLight intensity={0.38} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <directionalLight
        position={[x, y, z]}
        intensity={lighting.intensity}
        color="#FFE3A3"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <pointLight position={[-4, 3.2, 3.5]} color="#D99B25" intensity={0.42} distance={12} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <pointLight position={[4.5, 1.4, -4]} color="#7A4B10" intensity={0.18} distance={10} />
    </>
  );
}

export default function Viewport3D({ walls, openings, lighting }: Viewport3DProps) {
  // Pre-check: avoid mounting Canvas at all if WebGL is unsupported
  const webgl = detectWebGL();
  if (!webgl.supported) {
    return (
      <div className="flex h-full w-full flex-col">
        <Viewport3DHeader wallCount={0} />
        <div className="flex-1 bg-muted">
          <Viewport3DFallback reason={webgl.reason ?? 'WebGL is not supported.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Viewport3DHeader wallCount={walls.length} />
      <div className="relative flex-1 overflow-hidden bg-[#14100a]">
        <WebGLErrorBoundary
          fallback={
            <Viewport3DFallback reason="WebGL context creation failed (BindToCurrentSequence). The 3D renderer could not initialise." />
          }
        >
          <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <color attach="background" args={["#14100A"]} />
            <PerspectiveCamera makeDefault position={[8, 6, 8]} />
            <OrbitControls enableDamping dampingFactor={0.06} autoRotate autoRotateSpeed={0.25} />

            <Lighting lighting={lighting} />
            <SacredAtmosphere />

            <Floor />

            {walls.map((wall) => (
              <WallMesh key={wall.id} wall={wall} openings={openings} />
            ))}

            {/* @ts-expect-error - React Three Fiber JSX types */}
            <gridHelper args={[20, 20, '#C99A27', '#5C4B2A']} />
          </Canvas>
        </WebGLErrorBoundary>

        {/* Atmosphere label overlay */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-xl border border-primary/25 bg-black/35 px-3 py-2 text-right shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">
            <Sparkles className="h-3 w-3" /> Architect Energy
          </div>
          <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-stone-300/70">Sacred geometry atmosphere</p>
        </div>

        {/* Orbit hint overlay */}
        <div
          className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{ background: 'hsl(var(--ws-toolbar) / 0.85)', border: '1px solid hsl(var(--ws-border))' }}
        >
          <RotateCcw className="h-2.5 w-2.5" style={{ color: 'hsl(var(--ws-text-faint))' }} />
          <span style={{ fontSize: '9px', color: 'hsl(var(--ws-text-faint))', letterSpacing: '0.04em' }}>
            Drag to orbit · Scroll to zoom · Idle energy enabled
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Premium 3D Viewport Header ──────────────────────────────────────────────
function Viewport3DHeader({ wallCount }: { wallCount: number }) {
  return (
    <div
      className="flex h-7 shrink-0 items-center gap-2 px-3"
      style={{
        background: 'linear-gradient(90deg, hsl(var(--ws-toolbar)) 0%, hsl(39 28% 12%) 100%)',
        borderBottom: '1px solid hsl(43 58% 44% / 0.22)',
        boxShadow: 'inset 0 -1px 0 hsl(43 90% 70% / 0.06)',
      }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-1.5">
        <Box className="h-3 w-3" style={{ color: 'hsl(var(--ws-active))' }} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'hsl(var(--ws-text))',
          }}
        >
          Sacred 3D View
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Wall count badge */}
      <div
        className="flex items-center gap-1 rounded px-1.5 py-0.5"
        style={{ background: 'hsl(var(--ws-active-bg))', border: '1px solid hsl(var(--ws-active) / 0.3)' }}
      >
        <Layers className="h-2.5 w-2.5" style={{ color: 'hsl(var(--ws-active))' }} />
        <span style={{ fontSize: '9px', color: 'hsl(var(--ws-active))', fontFamily: 'monospace' }}>
          {wallCount} wall{wallCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Engine badge */}
      <div
        className="rounded px-1.5 py-0.5"
        style={{ background: 'hsl(var(--ws-border-subtle))', border: '1px solid hsl(var(--ws-border))' }}
      >
        <span style={{ fontSize: '9px', color: 'hsl(var(--ws-text-faint))', letterSpacing: '0.06em' }}>
          WebGL · Atmosphere
        </span>
      </div>
    </div>
  );
}
