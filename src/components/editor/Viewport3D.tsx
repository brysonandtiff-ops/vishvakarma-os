// 3D Viewport using React Three Fiber — with WebGL error boundary
/// <reference path="../three.d.ts" />
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { Wall, Opening, LightingConfig } from '@/types';
import * as THREE from 'three';
import { Box, AlertTriangle, RefreshCw, Layers, RotateCcw } from 'lucide-react';
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
      >
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[length / 100, wall.height / 100, wall.thickness / 100]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#9C9080" roughness={0.8} />
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
              color={opening.type === 'door' ? '#C85A54' : '#C8963A'}
              transparent 
              opacity={0.7}
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <planeGeometry args={[20, 20]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
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
      <ambientLight intensity={0.3} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <directionalLight
        position={[x, y, z]}
        intensity={lighting.intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
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
      <div className="relative flex-1">
        <WebGLErrorBoundary
          fallback={
            <Viewport3DFallback reason="WebGL context creation failed (BindToCurrentSequence). The 3D renderer could not initialise." />
          }
        >
          <Canvas shadows style={{ width: '100%', height: '100%' }}>
            <PerspectiveCamera makeDefault position={[8, 6, 8]} />
            <OrbitControls enableDamping dampingFactor={0.05} />

            <Lighting lighting={lighting} />

            <Floor />

            {walls.map((wall) => (
              <WallMesh key={wall.id} wall={wall} openings={openings} />
            ))}

            {/* @ts-expect-error - React Three Fiber JSX types */}
            <gridHelper args={[20, 20, '#B8941F', '#D4CFC4']} />
          </Canvas>
        </WebGLErrorBoundary>

        {/* Orbit hint overlay */}
        <div
          className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{ background: 'hsl(var(--ws-toolbar) / 0.85)', border: '1px solid hsl(var(--ws-border))' }}
        >
          <RotateCcw className="h-2.5 w-2.5" style={{ color: 'hsl(var(--ws-text-faint))' }} />
          <span style={{ fontSize: '9px', color: 'hsl(var(--ws-text-faint))', letterSpacing: '0.04em' }}>
            Drag to orbit · Scroll to zoom
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
        background: 'linear-gradient(90deg, hsl(var(--ws-toolbar)) 0%, hsl(var(--ws-bg)) 100%)',
        borderBottom: '1px solid hsl(var(--ws-border))',
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
          3D View
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
          WebGL · R3F
        </span>
      </div>
    </div>
  );
}
