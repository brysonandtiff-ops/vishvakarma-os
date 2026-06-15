import type { PatternKey } from '@/core/texturePatterns';

export type PbrBundleKey =
  | 'paint'
  | 'plaster'
  | 'wood'
  | 'concrete'
  | 'marble'
  | 'tile'
  | 'metal'
  | 'grass'
  | 'stone'
  | 'fabric'
  | 'bark';

export interface PbrBundleConfig {
  folder: PbrBundleKey;
  fallbackPattern: PatternKey;
  roughness: number;
  metalness: number;
  repeat: [number, number];
  /** Use meshPhysicalMaterial for glass-like surfaces */
  physical?: boolean;
  transmission?: number;
  ior?: number;
}

const BASE = '/textures';

export function pbrTextureUrl(folder: PbrBundleKey, map: 'color' | 'normal' | 'roughness'): string {
  return `${BASE}/${folder}/${map}.jpg`;
}

export const PBR_BUNDLES: Record<PbrBundleKey, PbrBundleConfig> = {
  paint: { folder: 'paint', fallbackPattern: 'plaster', roughness: 0.84, metalness: 0.04, repeat: [3, 2] },
  plaster: { folder: 'plaster', fallbackPattern: 'plaster', roughness: 0.88, metalness: 0.03, repeat: [3, 2] },
  wood: { folder: 'wood', fallbackPattern: 'wood', roughness: 0.64, metalness: 0.05, repeat: [4, 4] },
  concrete: { folder: 'concrete', fallbackPattern: 'concrete', roughness: 0.94, metalness: 0.02, repeat: [3, 3] },
  marble: { folder: 'marble', fallbackPattern: 'marble', roughness: 0.28, metalness: 0.08, repeat: [2, 2] },
  tile: { folder: 'tile', fallbackPattern: 'tile', roughness: 0.42, metalness: 0.04, repeat: [4, 4] },
  metal: { folder: 'metal', fallbackPattern: 'metal', roughness: 0.32, metalness: 0.92, repeat: [2, 2] },
  grass: { folder: 'grass', fallbackPattern: 'grass', roughness: 0.94, metalness: 0.02, repeat: [8, 8] },
  stone: { folder: 'stone', fallbackPattern: 'stone', roughness: 0.82, metalness: 0.05, repeat: [3, 3] },
  fabric: { folder: 'fabric', fallbackPattern: 'fabric', roughness: 0.9, metalness: 0, repeat: [4, 4] },
  bark: { folder: 'bark', fallbackPattern: 'bark', roughness: 0.9, metalness: 0.02, repeat: [1, 4] },
};

export const HDRI_STUDIO_ARCH = '/hdri/studio-arch.hdr';

const MATERIAL_TYPE_TO_PBR: Record<string, PbrBundleKey> = {
  paint: 'paint',
  wood: 'wood',
  concrete: 'concrete',
  stone: 'marble',
  tile: 'tile',
  metal: 'metal',
  glass: 'paint',
  custom: 'paint',
};

const PRESET_ID_TO_PBR: Record<string, PbrBundleKey> = {
  'material-paint': 'paint',
  'material-wood': 'wood',
  'material-concrete': 'concrete',
  'material-marble': 'marble',
  'material-tile': 'tile',
  'material-metal': 'metal',
  'material-glass': 'paint',
};

export function getPbrBundleForMaterialType(type: string): PbrBundleConfig {
  const key = MATERIAL_TYPE_TO_PBR[type] ?? 'paint';
  return PBR_BUNDLES[key];
}

export function getPbrBundleForPreset(materialId: string): PbrBundleConfig {
  if (PRESET_ID_TO_PBR[materialId]) {
    return PBR_BUNDLES[PRESET_ID_TO_PBR[materialId]];
  }
  if (materialId.includes('wood')) return PBR_BUNDLES.wood;
  if (materialId.includes('concrete')) return PBR_BUNDLES.concrete;
  if (materialId.includes('marble') || materialId.includes('stone')) return PBR_BUNDLES.marble;
  if (materialId.includes('tile')) return PBR_BUNDLES.tile;
  if (materialId.includes('metal')) return PBR_BUNDLES.metal;
  if (materialId.includes('glass')) return PBR_BUNDLES.paint;
  return PBR_BUNDLES.paint;
}

export function getPbrBundleForSurfaceRole(role: string): PbrBundleConfig {
  switch (role) {
    case 'wood':
      return PBR_BUNDLES.wood;
    case 'fabric':
      return PBR_BUNDLES.fabric;
    case 'leaf':
      return { ...PBR_BUNDLES.grass, fallbackPattern: 'leaf' };
    case 'bark':
      return PBR_BUNDLES.bark;
    case 'stone':
      return PBR_BUNDLES.stone;
    case 'grass':
      return PBR_BUNDLES.grass;
    case 'water':
      return { ...PBR_BUNDLES.paint, fallbackPattern: 'waterNormal', physical: true, transmission: 0.55, ior: 1.33 };
    default:
      return PBR_BUNDLES.paint;
  }
}

/** Glass preset uses physical material without bundled maps */
export const GLASS_SURFACE: PbrBundleConfig = {
  folder: 'paint',
  fallbackPattern: 'paint',
  roughness: 0.06,
  metalness: 0.02,
  repeat: [1, 1],
  physical: true,
  transmission: 0.72,
  ior: 1.45,
};
