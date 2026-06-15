/// <reference path="../../three.d.ts" />
import type { ReactNode } from 'react';
import type { FurnitureItem, LandscapeElement, Material, Staircase } from '@/types';
import {
  canvasToWorld,
  getFurnitureDefaults,
  getLandscapeDefaults,
  hashIdToRotation,
  pxToM,
  type SceneOrigin,
} from '@/core/sceneVisualCatalog';
import {
  AnimatedWaterMaterial,
  ExteriorFloorMaterial,
  FloorSurfaceMaterial,
  PatternStandardMaterial,
  PbrSurfaceMaterial,
} from '@/components/editor/sceneMaterials';
import { getPbrBundleForMaterialType, getPbrBundleForSurfaceRole } from '@/core/scenePbrCatalog';
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

function WoodMaterial({ color = WOOD, roughness = 0.68 }: { color?: string; roughness?: number }) {
  return (
    <PbrSurfaceMaterial
      bundle={getPbrBundleForMaterialType('wood')}
      color={color}
      roughness={roughness}
      metalness={0.05}
    />
  );
}

function FabricMaterial({ color = FABRIC, roughness = 0.9 }: { color?: string; roughness?: number }) {
  return (
    <PbrSurfaceMaterial
      bundle={getPbrBundleForSurfaceRole('fabric')}
      color={color}
      roughness={roughness}
      metalness={0}
    />
  );
}

function LeafMaterial({ color = ATMOSPHERE.leaf, roughness = 0.85 }: { color?: string; roughness?: number }) {
  return (
    <PatternStandardMaterial pattern="leaf" color={color} roughness={roughness} metalness={0.02} repeat={[3, 3]} />
  );
}

function BarkMaterial() {
  return (
    <PbrSurfaceMaterial
      bundle={getPbrBundleForSurfaceRole('bark')}
      color={ATMOSPHERE.bark}
      roughness={0.9}
      metalness={0.02}
      repeat={[1, 4]}
    />
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

function ColumnMesh({ hw }: { hw: number; hd: number }) {
  const shaftR = hw * 0.72;
  const baseR = hw * 0.98;
  const capitalR = hw * 0.94;
  const baseH = 0.08;
  const shaftH = 2.04;
  const capitalH = 0.2;
  const stone = (
    <PatternStandardMaterial pattern="stone" color="#b8b4ac" roughness={0.82} metalness={0.05} repeat={[2, 2]} />
  );

  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[baseR, baseR, baseH, 20]} />
        {stone}
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH + shaftH / 2, 0]} castShadow receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[shaftR, shaftR, shaftH, 20]} />
        {stone}
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH + shaftH + capitalH / 2, 0]} castShadow receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[capitalR, capitalR, capitalH, 20]} />
        {stone}
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function MandirMesh({ hw, hd }: { hw: number; hd: number }) {
  const baseH = 0.12;
  const bodyH = 0.55;
  const domeH = 0.22;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, baseH, hd * 2]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH + bodyH / 2, 0]} castShadow receiveShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 1.85, bodyH, hd * 1.85]} />
        <WoodMaterial color={WOOD_LIGHT} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, baseH + bodyH + domeH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <sphereGeometry args={[hw * 0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <PbrSurfaceMaterial bundle={getPbrBundleForMaterialType('metal')} color="#D4A832" roughness={0.35} metalness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
    </>
  );
}

function PujaShelfMesh({ hw, hd }: { hw: number; hd: number }) {
  const shelfH = hd * 2;
  const depths = [-hd * 0.55, 0, hd * 0.55];
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, shelfH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, shelfH, hd * 2]} />
        <WoodMaterial color={WOOD} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {depths.map((z) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={z} position={[0, shelfH * 0.35, z]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <boxGeometry args={[hw * 1.85, 0.03, hd * 1.6]} />
          <WoodMaterial color={WOOD_LIGHT} roughness={0.55} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
    </>
  );
}

function DiwanMesh({ hw, hd }: { hw: number; hd: number }) {
  const seatH = 0.22;
  const backH = 0.28;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, seatH / 2 + 0.08, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.1, seatH, hd * 2 - 0.14]} />
        <FabricMaterial color={FABRIC} roughness={0.88} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, backH / 2 + 0.08, -hd + 0.08]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.08, backH, 0.12]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      <FurnitureLegs hw={hw} hd={hd} legH={0.08} />
    </>
  );
}

function CharpaiMesh({ hw, hd }: { hw: number; hd: number }) {
  const frameH = 0.14;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, frameH / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.06, 0.04, hd * 2 - 0.06]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, frameH / 2 + 0.02, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2 - 0.12, 0.02, hd * 2 - 0.12]} />
        <FabricMaterial color={FABRIC_LIGHT} roughness={0.92} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {([
        [-hw + 0.06, -hd + 0.06],
        [hw - 0.06, -hd + 0.06],
        [-hw + 0.06, hd - 0.06],
        [hw - 0.06, hd - 0.06],
      ] as const).map(([lx, lz]) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={`${lx}-${lz}`} position={[lx, frameH / 2, lz]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <cylinderGeometry args={[0.025, 0.025, frameH, 8]} />
          <WoodMaterial color={WOOD_DARK} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
    </>
  );
}

function JaliScreenMesh({ hw, hd }: { hw: number; hd: number }) {
  const panelH = hd * 2;
  const rows = 4;
  const cols = 6;
  const cells: ReactNode[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = -hw + hw * 0.25 + col * (hw * 0.32);
      const cy = panelH * 0.15 + row * (panelH * 0.2);
      cells.push(
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={`${row}-${col}`} position={[cx, cy, 0]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <boxGeometry args={[hw * 0.22, panelH * 0.14, 0.02]} />
          <PbrSurfaceMaterial bundle={getPbrBundleForMaterialType('metal')} color="#C99A27" roughness={0.4} metalness={0.85} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>,
      );
    }
  }
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, panelH / 2, -0.04]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, panelH, 0.06]} />
        <WoodMaterial color={WOOD_DARK} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {cells}
    </>
  );
}

function ModularKitchenBaseMesh({ hw, hd }: { hw: number; hd: number }) {
  const h = hd * 2;
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, h / 2, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <boxGeometry args={[hw * 2, h, hd * 2]} />
        <WoodMaterial color={WOOD_LIGHT} roughness={0.58} />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {[1, 2, 3].map((i) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={i} position={[-hw + (hw * 2 * i) / 4, h / 2, hd - 0.01]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <boxGeometry args={[0.02, h - 0.04, 0.02]} />
          <WoodMaterial color={WOOD_DARK} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
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
    case 'column':
      return 2.32;
    case 'mandir':
      return 0.89;
    case 'puja_shelf':
      return 0.5;
    case 'diwan':
      return 0.36;
    case 'charpai':
      return 0.14;
    case 'jali_screen':
      return 0.55;
    case 'modular_kitchen_base':
      return 0.45;
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
    case 'column':
      return <ColumnMesh hw={hw} hd={hd} />;
    case 'mandir':
      return <MandirMesh hw={hw} hd={hd} />;
    case 'puja_shelf':
      return <PujaShelfMesh hw={hw} hd={hd} />;
    case 'diwan':
      return <DiwanMesh hw={hw} hd={hd} />;
    case 'charpai':
      return <CharpaiMesh hw={hw} hd={hd} />;
    case 'jali_screen':
      return <JaliScreenMesh hw={hw} hd={hd} />;
    case 'modular_kitchen_base':
      return <ModularKitchenBaseMesh hw={hw} hd={hd} />;
    default:
      return <GenericFurnitureMesh hw={hw} hd={hd} height={height} />;
  }
}

export function FurnitureMesh({ item, origin }: { item: FurnitureItem; origin?: SceneOrigin }) {
  const { x, z } = canvasToWorld(item.position, origin);
  const defaults = getFurnitureDefaults(item.type);
  const hw = pxToM(item.width ?? defaults.width) / 2;
  const hd = pxToM(item.depth ?? defaults.depth) / 2;
  const height = furnitureHeight(item.type);
  const yOffset = item.type === 'bed' || item.type === 'sofa' || item.type === 'chair' || item.type === 'column'
    || item.type === 'mandir' || item.type === 'diwan' || item.type === 'charpai'
    ? 0
    : height / 2;
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
      <mesh position={[0, 0.1, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[0.06, 0.09, 0.22, 12]} />
        <BarkMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {([
        [0, 0.48, 0, 0.28],
        [-0.14, 0.38, 0.08, 0.18],
        [0.14, 0.4, -0.08, 0.17],
        [0.05, 0.55, 0.1, 0.14],
      ] as const).map(([px, py, pz, r]) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={`${px}-${py}`} position={[px, py, pz]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <sphereGeometry args={[r, 16, 16]} />
          <LeafMaterial color="#2e7d32" roughness={0.82} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
    </>
  );
}

function PineMesh() {
  return (
    <>
      {/* @ts-expect-error - React Three Fiber JSX types */}
      <mesh position={[0, 0.1, 0]} castShadow>
        {/* @ts-expect-error - React Three Fiber JSX types */}
        <cylinderGeometry args={[0.05, 0.07, 0.2, 12]} />
        <BarkMaterial />
        {/* @ts-expect-error - React Three Fiber JSX types */}
      </mesh>
      {([
        [0.24, 0.34],
        [0.18, 0.52],
        [0.12, 0.68],
      ] as const).map(([radius, y], i) => (
        // @ts-expect-error - React Three Fiber JSX types
        <mesh key={i} position={[0, y, 0]} castShadow>
          {/* @ts-expect-error - React Three Fiber JSX types */}
          <coneGeometry args={[radius, 0.28, 14]} />
          <LeafMaterial color={i === 0 ? '#2e7d32' : '#388e3c'} roughness={0.82} />
          {/* @ts-expect-error - React Three Fiber JSX types */}
        </mesh>
      ))}
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

export function LandscapeMesh({ element, origin }: { element: LandscapeElement; origin?: SceneOrigin }) {
  const { x, z } = canvasToWorld(element.position, origin);
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
        <ExteriorFloorMaterial floorMaterial={floorMaterial} customMaterials={customMaterials} />
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

export function StairMeshes({
  staircases,
  origin,
}: {
  staircases: Staircase[];
  origin?: SceneOrigin;
}) {
  return (
    <>
      {staircases.map((staircase) => {
        const { x, z } = canvasToWorld(staircase.position, origin);
        const rotation = ((staircase.direction ?? 0) * Math.PI) / 180;
        return (
          // @ts-expect-error - React Three Fiber JSX types
          <group key={staircase.id} position={[x, 0, z]} rotation={[0, rotation, 0]}>
            {Array.from({ length: 6 }).map((_, step) => (
              // @ts-expect-error - React Three Fiber JSX types
              <mesh key={step} position={[0, step * 0.05 + 0.025, step * 0.1]} castShadow>
                {/* @ts-expect-error - React Three Fiber JSX types */}
                <boxGeometry args={[0.9, 0.05, 0.14]} />
                <WoodMaterial color={WOOD_LIGHT} />
                {/* @ts-expect-error - React Three Fiber JSX types */}
              </mesh>
            ))}
            {/* @ts-expect-error - React Three Fiber JSX types */}
          </group>
        );
      })}
    </>
  );
}
