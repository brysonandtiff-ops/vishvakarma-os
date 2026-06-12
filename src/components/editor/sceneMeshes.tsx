/// <reference path="../../three.d.ts" />
import type { ReactNode } from 'react';
import type { FurnitureItem, LandscapeElement } from '@/types';
import {
  canvasToWorld,
  getFurnitureDefaults,
  getLandscapeDefaults,
  hashIdToRotation,
  pxToM,
} from '@/core/sceneVisualCatalog';

const WOOD = '#6b4f3a';
const WOOD_DARK = '#4a3528';
const WOOD_LIGHT = '#8B6914';
const FABRIC = '#4a5568';
const FABRIC_LIGHT = '#718096';

function WoodMaterial({ color = WOOD, roughness = 0.72 }: { color?: string; roughness?: number }) {
  return (
    // @ts-expect-error - React Three Fiber JSX types
    <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />
  );
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC_LIGHT} roughness={0.85} metalness={0} />
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC} roughness={0.88} metalness={0} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, backH / 2 + 0.06, -hd + 0.1]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.08, backH, 0.14]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC_LIGHT} roughness={0.88} metalness={0} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[-hw + 0.12, seatH / 2 + 0.12, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[0.16, seatH + 0.12, hd * 2 - 0.1]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC} roughness={0.88} metalness={0} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[hw - 0.12, seatH / 2 + 0.12, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[0.16, seatH + 0.12, hd * 2 - 0.1]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC} roughness={0.88} metalness={0} />
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color={FABRIC} roughness={0.85} metalness={0} />
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

export function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const { x, z } = canvasToWorld(item.position);
  const defaults = getFurnitureDefaults(item.type);
  const hw = pxToM(item.width ?? defaults.width) / 2;
  const hd = pxToM(item.depth ?? defaults.depth) / 2;
  const height = furnitureHeight(item.type);
  const yOffset = item.type === 'bed' || item.type === 'sofa' || item.type === 'chair' ? 0 : height / 2;

  let body: ReactNode;
  switch (item.type) {
    case 'bed':
      body = <BedMesh hw={hw} hd={hd} />;
      break;
    case 'sofa':
      body = <SofaMesh hw={hw} hd={hd} />;
      break;
    case 'chair':
      body = <ChairMesh hw={hw} hd={hd} />;
      break;
    case 'table':
      body = <TableMesh hw={hw} hd={hd} />;
      break;
    case 'dining_table':
      body = <TableMesh hw={hw} hd={hd} legCount={6} />;
      break;
    case 'desk':
      body = <DeskMesh hw={hw} hd={hd} />;
      break;
    case 'wardrobe':
      body = <WardrobeMesh hw={hw} hd={hd} />;
      break;
    case 'nightstand':
      body = <NightstandMesh hw={hw} hd={hd} />;
      break;
    default:
      body = <GenericFurnitureMesh hw={hw} hd={hd} height={height} />;
  }

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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.42, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.24, 12, 12]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#2e7d32" roughness={0.82} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[-0.1, 0.35, 0.06]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.14, 10, 10]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#388e3c" roughness={0.85} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0.1, 0.38, -0.05]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[0.12, 10, 10]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#43a047" roughness={0.85} />
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.32, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <coneGeometry args={[0.2, 0.38, 8]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#2e7d32" roughness={0.82} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.52, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <coneGeometry args={[0.15, 0.28, 8]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#388e3c" roughness={0.82} />
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
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <meshStandardMaterial color="#388e3c" roughness={0.85} />
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
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
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
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial color="#78716c" roughness={0.95} metalness={0.02} />
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
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshStandardMaterial color="#8d6e63" roughness={0.92} metalness={0.02} />
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
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <meshPhysicalMaterial
        color="#1a6baf"
        transparent
        opacity={0.82}
        transmission={0.55}
        roughness={0.05}
        metalness={0.05}
        thickness={0.2}
        ior={1.33}
      />
      {/* @ts-expect-error - React Three Fiber JSX types */}
    </mesh>
  );
}

export function LandscapeMesh({ element }: { element: LandscapeElement }) {
  const { x, z } = canvasToWorld(element.position);
  const defaults = getLandscapeDefaults(element.type);
  const hw = pxToM(element.width ?? defaults.width) / 2;
  const hd = pxToM(element.depth ?? defaults.depth) / 2;
  const rockRotation = element.rotation !== undefined
    ? (element.rotation * Math.PI) / 180
    : hashIdToRotation(element.id);

  let body: ReactNode;
  switch (element.type) {
    case 'tree':
      body = <TreeMesh />;
      break;
    case 'pine':
      body = <PineMesh />;
      break;
    case 'shrub':
      body = <ShrubMesh />;
      break;
    case 'flower':
      body = <FlowerMesh />;
      break;
    case 'rock':
      body = <RockMesh rotation={rockRotation} />;
      break;
    case 'path':
      body = <PathMesh hw={hw} hd={hd} />;
      break;
    case 'water':
      body = <WaterMesh hw={hw} hd={hd} />;
      break;
    default:
      body = <ShrubMesh />;
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

export function SceneFloor() {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <planeGeometry args={[28, 28]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#4a7c59" roughness={0.92} metalness={0.02} transparent opacity={0.35} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <planeGeometry args={[22, 22]} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <meshStandardMaterial color="#DCD0B8" roughness={0.84} metalness={0.03} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}
