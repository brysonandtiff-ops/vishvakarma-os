import type { LightingConfig, Material, Opening, ProjectManifest, Wall } from '@/types';

export const PROJECT_SPEC_VERSION = '1.0.0';
export const DEFAULT_GRID_SIZE = 20;
export const DEFAULT_FLOOR_MATERIAL = 'material-concrete';

export const DEFAULT_PROJECT_LIGHTING: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

export interface ProjectManifestInput {
  name: string;
  description?: string;
  walls?: Wall[];
  openings?: Opening[];
  materials?: Material[];
  floorMaterial?: string;
  lighting?: LightingConfig;
  gridSize?: number;
  snapToGrid?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  author?: string;
}

export interface ProjectManifestSummary {
  wallCount: number;
  openingCount: number;
  materialCount: number;
  hasGeometry: boolean;
  snapToGrid: boolean;
  gridSize: number;
  lighting: LightingConfig;
}

function normalizeIsoTimestamp(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const time = Date.parse(value);
  return Number.isNaN(time) ? fallback : new Date(time).toISOString();
}

export function createProjectManifest(input: ProjectManifestInput): ProjectManifest {
  const now = new Date().toISOString();
  const created = normalizeIsoTimestamp(input.createdAt, now);
  const modified = normalizeIsoTimestamp(input.modifiedAt, now);

  return {
    version: PROJECT_SPEC_VERSION,
    name: input.name.trim() || 'Untitled Project',
    description: input.description,
    walls: input.walls ?? [],
    openings: input.openings ?? [],
    materials: input.materials ?? [],
    floorMaterial: input.floorMaterial ?? DEFAULT_FLOOR_MATERIAL,
    lighting: input.lighting ?? DEFAULT_PROJECT_LIGHTING,
    gridSize: input.gridSize ?? DEFAULT_GRID_SIZE,
    snapToGrid: input.snapToGrid ?? true,
    metadata: {
      created,
      modified,
      author: input.author,
    },
  };
}

export function createEmptyProjectManifest(name: string, description?: string): ProjectManifest {
  return createProjectManifest({ name, description });
}

export function summarizeProjectManifest(manifest: ProjectManifest): ProjectManifestSummary {
  return {
    wallCount: manifest.walls.length,
    openingCount: manifest.openings.length,
    materialCount: manifest.materials.length,
    hasGeometry: manifest.walls.length > 0 || manifest.openings.length > 0,
    snapToGrid: manifest.snapToGrid,
    gridSize: manifest.gridSize,
    lighting: manifest.lighting,
  };
}

export function isProjectManifest(value: unknown): value is ProjectManifest {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<ProjectManifest>;

  return (
    typeof candidate.version === 'string' &&
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.walls) &&
    Array.isArray(candidate.openings) &&
    Array.isArray(candidate.materials) &&
    typeof candidate.floorMaterial === 'string' &&
    typeof candidate.gridSize === 'number' &&
    typeof candidate.snapToGrid === 'boolean' &&
    typeof candidate.lighting === 'object' &&
    candidate.lighting !== null &&
    typeof candidate.metadata === 'object' &&
    candidate.metadata !== null
  );
}
