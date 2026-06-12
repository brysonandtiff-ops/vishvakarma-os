import { MATERIAL_PRESETS } from '@/components/editor/MaterialPicker';
import type { PatternKey } from '@/core/texturePatterns';
import { LANDSCAPE_TYPES } from '@/core/sceneVisualCatalog';

export type SurfaceRole = 'wood' | 'fabric' | 'leaf' | 'bark' | 'stone' | 'grass' | 'water';

const MATERIAL_TYPE_PATTERNS: Record<string, PatternKey> = {
  paint: 'paint',
  wood: 'wood',
  concrete: 'concrete',
  custom: 'paint',
};

export function getPatternForMaterialType(type: string): PatternKey {
  return MATERIAL_TYPE_PATTERNS[type] ?? 'paint';
}

export function getPresetPatternForMaterial(materialId: string): PatternKey {
  const preset = MATERIAL_PRESETS.find((entry) => entry.id === materialId);
  if (preset) return getPatternForMaterialType(preset.type);
  if (materialId.includes('wood')) return 'wood';
  if (materialId.includes('concrete')) return 'concrete';
  return 'paint';
}

export function getPatternForSurfaceRole(role: SurfaceRole): PatternKey {
  switch (role) {
    case 'wood':
      return 'wood';
    case 'fabric':
      return 'fabric';
    case 'leaf':
      return 'leaf';
    case 'bark':
      return 'bark';
    case 'stone':
      return 'stone';
    case 'grass':
      return 'grass';
    case 'water':
      return 'waterNormal';
    default:
      return 'paint';
  }
}

export function getLandscapePattern(type: string, part: 'body' | 'trunk' = 'body'): PatternKey {
  switch (type) {
    case 'tree':
    case 'pine':
      return part === 'trunk' ? 'bark' : 'leaf';
    case 'shrub':
    case 'flower':
      return part === 'trunk' ? 'bark' : 'leaf';
    case 'rock':
      return 'stone';
    case 'path':
      return 'stone';
    case 'water':
      return 'waterNormal';
    default:
      return 'leaf';
  }
}

export function getAllLandscapeTypesWithPatterns(): string[] {
  return [...LANDSCAPE_TYPES];
}
