/// <reference path="../../three.d.ts" />
import type { ReactNode } from 'react';
import type { FurnitureItem, LandscapeElement, Material } from '@/types';
import {
  canvasToWorld,
  getFurnitureDefaults,
  getLandscapeDefaults,
  hashIdToRotation,
  pxToM,
} from '@/core/sceneVisualCatalog';
import {
  AnimatedWaterMaterial,
  FloorSurfaceMaterial,
  PatternStandardMaterial,
} from '@/components/editor/sceneMaterials';
import { GltfModelBody } from '@/components/editor/sceneGltfModels';
import { resolveModelUrl } from '@/core/sceneModelCatalog';

import {
  ATMOSPHERE,
  FABRIC,
  FABRIC_LIGHT,
  WOOD,
  WOOD_DARK,
  WOOD_LIGHT,
} from '@/core/sceneDrawingTokens';

function WoodMaterial({ color = WOOD, roughness = 0.72 }: { color?: string; roughness?: number }) {
  return <PatternStandardMaterial pattern="wood" color={color} roughness={roughness} metalness={0.05} />;
}

function FabricMaterial({ color = FABRIC, roughness = 0.88 }: { color?: string; roughness?: number }) {
  return <PatternStandardMaterial pattern="fabric" color={color} roughness={roughness} metalness={0} />;
}

function LeafMaterial({ color = ATMOSPHERE.leaf, roughness = 0.85 }: { color?: string; roughness?: number }) {
  return <PatternStandardMaterial pattern="leaf" color={color} roughness={roughness} metalness={0.02} repeat={[3, 3]} />;
}

function BarkMaterial() {
  return <PatternStandardMaterial pattern="bark" color={ATMOSPHERE.bark} roughness={0.9} metalness={0.02} repeat={[1, 4]} />;
}

function FurnitureLegs({ hw, hd, legH = 0.08 }: { hw: number; hd: number; legH?: number }) {
  const inset = Math.min(hw * 0.35, hd * 0.35, 0.06);
  const positions: [number, number, number][] = [
    [-hw + inset, legH / 2, -hd + inset],
    [hw - inset, legH / 2, -hd + inset],
    [-hw + inset, legH / 2, hd - inset],
    [hw - inset, legH / 2, hd - inset],
  ];
  return (
    <>
      {positions.map((pos) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={pos.join(',')} position={pos} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <boxGeometry args={[0.04, legH, 0.04]} />
          <WoodMaterial color={WOOD_DARK} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
    </>
  );
}

function BedMesh({ hw, hd }: { hw: number; hd: number }) {
  const mattressH = 0.18;
  const legH = 0.08;
  return (
    <>
      <FurnitureLegs hw={hw} hd={hd} legH={legH} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + mattressH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.08, mattressH, hd * 2 - 0.08]} />
        <FabricMaterial color={FABRIC_LIGHT} roughness={0.85} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + mattressH + 0.22, -hd + 0.06]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, 0.44, 0.1]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function SofaMesh({ hw, hd }: { hw: number; hd: number }) {
  const seatH = 0.22;
  const backH = 0.38;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, seatH / 2 + 0.06, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.1, seatH, hd * 2 - 0.12]} />
        <FabricMaterial color={FABRIC} roughness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, backH / 2 + 0.06, -hd + 0.1]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.08, backH, 0.14]} />
        <FabricMaterial color={FABRIC_LIGHT} roughness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[-hw + 0.12, seatH / 2 + 0.12, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[0.16, seatH + 0.12, hd * 2 - 0.1]} />
        <FabricMaterial color={FABRIC} roughness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[hw - 0.12, seatH / 2 + 0.12, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[0.16, seatH + 0.12, hd * 2 - 0.1]} />
        <FabricMaterial color={FABRIC} roughness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function ChairMesh({ hw, hd }: { hw: number; hd: number }) {
  const seatH = 0.06;
  const legH = 0.22;
  return (
    <>
      <FurnitureLegs hw={hw} hd={hd} legH={legH} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + seatH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.04, seatH, hd * 2 - 0.04]} />
        <WoodMaterial color={WOOD_LIGHT} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + 0.28, -hd + 0.05]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.06, 0.36, 0.06]} />
        <FabricMaterial color={FABRIC} roughness={0.85} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function TableMesh({ hw, hd, legCount = 4 }: { hw: number; hd: number; legCount?: number }) {
  const topH = 0.05;
  const legH = 0.38;
  const legPositions: [number, number, number][] =
    legCount === 6
      ? [
          [-hw + 0.08, legH / 2, -hd + 0.08],
          [hw - 0.08, legH / 2, -hd + 0.08],
          [-hw + 0.08, legH / 2, hd - 0.08],
          [hw - 0.08, legH / 2, hd - 0.08],
          [0, legH / 2, -hd + 0.08],
          [0, legH / 2, hd - 0.08],
        ]
      : [
          [-hw + 0.06, legH / 2, -hd + 0.06],
          [hw - 0.06, legH / 2, -hd + 0.06],
          [-hw + 0.06, legH / 2, hd - 0.06],
          [hw - 0.06, legH / 2, hd - 0.06],
        ];
  return (
    <>
      {legPositions.map((pos) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={pos.join(',')} position={pos} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <boxGeometry args={[0.05, legH, 0.05]} />
          <WoodMaterial color={WOOD_DARK} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + topH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, topH, hd * 2]} />
        <WoodMaterial color={WOOD_LIGHT} roughness={0.55} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function DeskMesh({ hw, hd }: { hw: number; hd: number }) {
  const legH = 0.42;
  return (
    <>
      <FurnitureLegs hw={hw} hd={hd} legH={legH} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, legH + 0.025, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, 0.05, hd * 2]} />
        <WoodMaterial color={WOOD_LIGHT} roughness={0.55} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[-hw * 0.35, legH * 0.45, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 0.55, legH * 0.75, hd * 0.85]} />
        <WoodMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function WardrobeMesh({ hw, hd }: { hw: number; hd: number }) {
  const h = 0.95;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, h / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, h, hd * 2]} />
        <WoodMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, h / 2, hd - 0.01]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[0.02, h * 0.92, 0.01]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function NightstandMesh({ hw, hd }: { hw: number; hd: number }) {
  const h = 0.28;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, h / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, h, hd * 2]} />
        <WoodMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, h * 0.55, hd - 0.005]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 1.6, 0.02, 0.01]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function GenericFurnitureMesh({ hw, hd, height }: { hw: number; hd: number; height: number }) {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh castShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <boxGeometry args={[hw * 2, height, hd * 2]} />
      <WoodMaterial />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

function furnitureHeight(type: string): number {
  switch (type) {
    case 'bed':
      return 0.5;
    case 'sofa':
      return 0.55;
    case 'chair':
      return 0.45;
    case 'wardrobe':
      return 0.95;
    case 'nightstand':
      return 0.28;
    case 'desk':
      return 0.47;
    case 'dining_table':
      return 0.43;
    default:
      return 0.4;
  }
}

export function ParametricFurnitureBody({
  type,
  hw,
  hd,
}: {
  type: string;
  hw: number;
  hd: number;
}) {
  const height = furnitureHeight(type);
  switch (type) {
    case 'bed':
      return <BedMesh hw={hw} hd={hd} />;
    case 'sofa':
      return <SofaMesh hw={hw} hd={hd} />;
    case 'chair':
      return <ChairMesh hw={hw} hd={hd} />;
    case 'table':
      return <TableMesh hw={hw} hd={hd} />;
    case 'dining_table':
      return <TableMesh hw={hw} hd={hd} legCount={6} />;
    case 'desk':
      return <DeskMesh hw={hw} hd={hd} />;
    case 'wardrobe':
      return <WardrobeMesh hw={hw} hd={hd} />;
    case 'nightstand':
      return <NightstandMesh hw={hw} hd={hd} />;
    default:
      return <GenericFurnitureMesh hw={hw} hd={hd} height={height} />;
  }
}

export function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const { x, z } = canvasToWorld(item.position);
  const defaults = getFurnitureDefaults(item.type);
  const hw = pxToM(item.width ?? defaults.width) / 2;
  const hd = pxToM(item.depth ?? defaults.depth) / 2;
  const height = furnitureHeight(item.type);
  const yOffset = item.type === 'bed' || item.type === 'sofa' || item.type === 'chair' ? 0 : height / 2;
  const modelUrl = resolveModelUrl('furniture', item.type, item.modelUrl);
  const parametric = <ParametricFurnitureBody type={item.type} hw={hw} hd={hd} />;

  const body = modelUrl ? (
    <GltfModelBody
      url={modelUrl}
      targetWidthM={hw * 2}
      targetDepthM={hd * 2}
      modelScale={item.modelScale}
      category="furniture"
      type={item.type}
      fallback={parametric}
    />
  ) : (
    parametric
  );

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group
      position={[x, yOffset, z]}
      rotation={[0, ((item.rotation ?? 0) * Math.PI) / 180, 0]}
    >
      {body}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

function TreeMesh() {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.08, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[0.05, 0.07, 0.16, 8]} />
        <BarkMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.42, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.24, 12, 12]} />
        <LeafMaterial color="#2e7d32" roughness={0.82} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[-0.1, 0.35, 0.06]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.14, 10, 10]} />
        <LeafMaterial color="#388e3c" roughness={0.85} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0.1, 0.38, -0.05]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.12, 10, 10]} />
        <LeafMaterial color="#43a047" roughness={0.85} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function PineMesh() {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.08, 0]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[0.04, 0.06, 0.16, 8]} />
        <BarkMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.32, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <coneGeometry args={[0.2, 0.38, 8]} />
        <LeafMaterial color="#2e7d32" roughness={0.82} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.52, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <coneGeometry args={[0.15, 0.28, 8]} />
        <LeafMaterial color="#388e3c" roughness={0.82} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function ShrubMesh() {
  return (
    <>
      {([
        [0, 0.12, 0, 0.16],
        [-0.08, 0.1, 0.05, 0.11],
        [0.07, 0.11, -0.06, 0.12],
      ] as const).map(([px, py, pz, r]) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={`${px}-${py}`} position={[px, py, pz]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <sphereGeometry args={[r, 10, 10]} />
          <LeafMaterial color="#388e3c" roughness={0.85} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
    </>
  );
}

function FlowerMesh() {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.06, 0]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[0.008, 0.012, 0.12, 6]} />
        <BarkMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          // @ts-expect-error - React Three Fiber JSX types
          <mesh key={i} position={[Math.cos(angle) * 0.05, 0.12, Math.sin(angle) * 0.05]} castShadow>
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <sphereGeometry args={[0.035, 8, 8]} />
            {/* @ts-expect-error - React Three Fiber JSX types */}
            <meshStandardMaterial color={i % 2 === 0 ? '#e91e63' : '#f48fb1'} roughness={0.7} />
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </mesh>
        );
      })}
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.12, 0]}>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.025, 8, 8]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#ffeb3b" roughness={0.6} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function RockMesh({ rotation }: { rotation: number }) {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh rotation={[0.2, rotation, 0.15]} castShadow receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <dodecahedronGeometry args={[0.12, 0]} />
      <PatternStandardMaterial pattern="stone" color="#78716c" roughness={0.95} metalness={0.02} repeat={[2, 2]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

function PathMesh({ hw, hd }: { hw: number; hd: number }) {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <planeGeometry args={[hw * 2, hd * 2]} />
      <PatternStandardMaterial pattern="stone" color="#8d6e63" roughness={0.92} metalness={0.02} repeat={[4, 2]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

function WaterMesh({ hw, hd }: { hw: number; hd: number }) {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <planeGeometry args={[hw * 2, hd * 2, 1, 1]} />
      <AnimatedWaterMaterial color="#1a6baf" repeat={[8, 8]} />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

export function ParametricLandscapeBody({
  type,
  hw,
  hd,
  rockRotation,
}: {
  type: string;
  hw: number;
  hd: number;
  rockRotation: number;
}) {
  switch (type) {
    case 'tree':
      return <TreeMesh />;
    case 'pine':
      return <PineMesh />;
    case 'shrub':
      return <ShrubMesh />;
    case 'flower':
      return <FlowerMesh />;
    case 'rock':
      return <RockMesh rotation={rockRotation} />;
    case 'path':
      return <PathMesh hw={hw} hd={hd} />;
    case 'water':
      return <WaterMesh hw={hw} hd={hd} />;
    default:
      return <ShrubMesh />;
  }
}

export function LandscapeMesh({ element }: { element: LandscapeElement }) {
  const { x, z } = canvasToWorld(element.position);
  const defaults = getLandscapeDefaults(element.type);
  const hw = pxToM(element.width ?? defaults.width) / 2;
  const hd = pxToM(element.depth ?? defaults.depth) / 2;
  const rockRotation = element.rotation !== undefined
    ? (element.rotation * Math.PI) / 180
    : hashIdToRotation(element.id);
  const modelUrl = resolveModelUrl('landscape', element.type, element.modelUrl);
  const parametric = (
    <ParametricLandscapeBody type={element.type} hw={hw} hd={hd} rockRotation={rockRotation} />
  );

  let body: ReactNode = modelUrl ? (
    <GltfModelBody
      url={modelUrl}
      targetWidthM={hw * 2}
      targetDepthM={hd * 2}
      modelScale={element.modelScale}
      category="landscape"
      type={element.type}
      fallback={parametric}
    />
  ) : (
    parametric
  );

  if (element.type === 'rock' && modelUrl) {
    body = (
      // @ts-expect-error - React Three Fiber JSX types
      <group rotation={[0.2, rockRotation, 0.15]}>
        {body}
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </group>
    );
  }

  const y = element.type === 'path' || element.type === 'water' ? 0 : 0;

  return (
    // @ts-expect-error - React Three Fiber JSX types
    <group position={[x, y, z]}>
      {body}
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </group>
  );
}

export function SceneFloor({
  floorMaterial = 'material-concrete',
  customMaterials = [],
}: {
  floorMaterial?: string;
  customMaterials?: Material[];
}) {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <planeGeometry args={[28, 28]} />
        <FloorSurfaceMaterial floorMaterial={floorMaterial} customMaterials={customMaterials} exterior />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <planeGeometry args={[22, 22]} />
        <FloorSurfaceMaterial floorMaterial={floorMaterial} customMaterials={customMaterials} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}
