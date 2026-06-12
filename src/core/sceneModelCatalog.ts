import { FURNITURE_PRESETS, LANDSCAPE_TYPES } from '@/core/sceneVisualCatalog';

export type SceneModelCategory = 'furniture' | 'landscape';

/** Landscape types that stay parametric (flat surfaces). */
export const PARAMETRIC_ONLY_LANDSCAPE = ['water', 'path'] as const;

const FURNITURE_MODEL_PATHS: Record<string, string> = Object.fromEntries(
  FURNITURE_PRESETS.map((preset) => [preset.type, `/models/furniture/${preset.type}.glb`]),
);

const LANDSCAPE_MODEL_PATHS: Record<string, string> = {
  tree: '/models/landscape/tree.glb',
  pine: '/models/landscape/pine.glb',
  shrub: '/models/landscape/shrub.glb',
  flower: '/models/landscape/flower.glb',
  rock: '/models/landscape/rock.glb',
};

export { FURNITURE_MODEL_PATHS, LANDSCAPE_MODEL_PATHS };

export interface BboxSize {
  x: number;
  y: number;
  z: number;
}

export interface FootprintFit {
  scale: number;
  groundOffsetY: number;
}

/** Per-type tuning after footprint fit (some CC0 assets need a nudge). */
const MODEL_SCALE_TUNING: Record<string, number> = {
  chair: 0.85,
  sofa: 0.9,
  bed: 0.95,
  tree: 1.1,
  pine: 1.05,
};

export function getModelScaleTuning(category: SceneModelCategory, type: string): number {
  const key = category === 'furniture' ? type : type;
  return MODEL_SCALE_TUNING[key] ?? 1;
}

export function resolveModelUrl(
  category: SceneModelCategory,
  type: string,
  override?: string,
): string | undefined {
  if (override) return override;
  if (category === 'landscape' && (PARAMETRIC_ONLY_LANDSCAPE as readonly string[]).includes(type)) {
    return undefined;
  }
  const paths = category === 'furniture' ? FURNITURE_MODEL_PATHS : LANDSCAPE_MODEL_PATHS;
  return paths[type];
}

export function getAllSceneModelUrls(): string[] {
  return [
    ...Object.values(FURNITURE_MODEL_PATHS),
    ...Object.values(LANDSCAPE_MODEL_PATHS),
  ];
}

export function getExpectedModelFiles(): string[] {
  return getAllSceneModelUrls().map((url) => url.replace(/^\//, 'public/'));
}

export function computeFootprintScale(
  bboxSize: BboxSize,
  targetWidthM: number,
  targetDepthM: number,
  minY = -bboxSize.y / 2,
): FootprintFit {
  const safeX = Math.max(bboxSize.x, 1e-4);
  const safeZ = Math.max(bboxSize.z, 1e-4);
  const scaleX = targetWidthM / safeX;
  const scaleZ = targetDepthM / safeZ;
  const scale = Math.min(scaleX, scaleZ);
  const groundOffsetY = -minY * scale;
  return { scale, groundOffsetY };
}

export function landscapeUsesGltf(type: string): boolean {
  return !(PARAMETRIC_ONLY_LANDSCAPE as readonly string[]).includes(type)
    && type in LANDSCAPE_MODEL_PATHS;
}

export function furnitureUsesGltf(type: string): boolean {
  return type in FURNITURE_MODEL_PATHS;
}

export function getAllGltfLandscapeTypes(): string[] {
  return LANDSCAPE_TYPES.filter(
    (type) => !(PARAMETRIC_ONLY_LANDSCAPE as readonly string[]).includes(type),
  );
}
