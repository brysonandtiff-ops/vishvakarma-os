import type { ProjectManifest } from '@/types';
import sampleHouse01 from '../../public/samples/sample-house-01.json';
import furnitureShowcaseJson from '../../public/samples/furniture-showcase.json';
import landscapeGardenJson from '../../public/samples/landscape-garden.json';
import terrainGardenJson from '../../public/samples/terrain-garden.json';
import mepLightingShowcaseJson from '../../public/samples/mep-lighting-showcase.json';
import fullFeatureShowcaseJson from '../../public/samples/full-feature-showcase.json';
import {
  build2BhkTemplate,
  build3BhkTemplate,
  buildAngledModernTemplate,
  buildBengaluruApartmentTemplate,
  buildCourtyardVillaIndianTemplate,
  buildDuplexTwoFloorTemplate,
  buildFamilyHome4BrTemplate,
  buildFamilyHome5BrTemplate,
  buildFullFeatureShowcaseTemplate,
  buildFurnitureShowcaseTemplate,
  buildLandscapeGardenTemplate,
  buildTerrainGardenTemplate,
  buildLShapeHomeTemplate,
  buildMepLightingShowcaseTemplate,
  buildStudioTemplate,
  buildTShapeWingTemplate,
  buildUShapeCourtyardTemplate,
  buildVastu2BhkIndianTemplate,
} from '@/core/templateBuilder';

const JSON_SAMPLE_MANIFESTS: Record<string, ProjectManifest> = {
  'sample-house-01': sampleHouse01 as ProjectManifest,
  'furniture-showcase': furnitureShowcaseJson as ProjectManifest,
  'landscape-garden': landscapeGardenJson as ProjectManifest,
  'terrain-garden': terrainGardenJson as ProjectManifest,
  'mep-lighting-showcase': mepLightingShowcaseJson as ProjectManifest,
  'full-feature-showcase': fullFeatureShowcaseJson as ProjectManifest,
};

export type SampleCategory = 'starter' | 'residential' | 'indian' | 'shapes' | 'interior' | 'landscape' | 'mep' | 'full';
export type SampleSurface = 'load-sample' | 'new-project';

export interface SampleDefinition {
  id: string;
  name: string;
  description: string;
  category: SampleCategory;
  source: { kind: 'json'; path: string } | { kind: 'builder'; build: () => ProjectManifest };
  surfaces: SampleSurface[];
}

export const SAMPLE_CATEGORY_LABELS: Record<SampleCategory, string> = {
  starter: 'Starter',
  residential: 'Residential',
  indian: 'Indian Residential',
  shapes: 'Building Shapes',
  interior: 'Interior',
  landscape: 'Nature & Garden',
  mep: 'MEP & Lighting',
  full: 'Full Showcase',
};

const BUILDERS: Record<string, () => ProjectManifest> = {
  studio: buildStudioTemplate,
  '2bhk': build2BhkTemplate,
  '3bhk': build3BhkTemplate,
  'family-home-4br': buildFamilyHome4BrTemplate,
  'family-home-5br': buildFamilyHome5BrTemplate,
  'duplex-two-floor': buildDuplexTwoFloorTemplate,
  'l-shape-home': buildLShapeHomeTemplate,
  'u-shape-courtyard': buildUShapeCourtyardTemplate,
  't-shape-wing': buildTShapeWingTemplate,
  'angled-modern': buildAngledModernTemplate,
  'furniture-showcase': buildFurnitureShowcaseTemplate,
  'landscape-garden': buildLandscapeGardenTemplate,
  'terrain-garden': buildTerrainGardenTemplate,
  'mep-lighting-showcase': buildMepLightingShowcaseTemplate,
  'full-feature-showcase': buildFullFeatureShowcaseTemplate,
  'vastu-2bhk-indian': buildVastu2BhkIndianTemplate,
  'courtyard-villa-indian': buildCourtyardVillaIndianTemplate,
  'bengaluru-3bhk': buildBengaluruApartmentTemplate,
};

export const SAMPLE_CATALOG: SampleDefinition[] = [
  {
    id: 'sample-house-01',
    name: 'Sample House 01',
    description: 'Simple single-room demo with one door and two windows',
    category: 'starter',
    source: { kind: 'json', path: '/samples/sample-house-01.json' },
    surfaces: ['load-sample'],
  },
  {
    id: 'studio',
    name: 'Studio Apartment',
    description: 'Compact studio with living and kitchen zones',
    category: 'residential',
    source: { kind: 'builder', build: buildStudioTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: '2bhk',
    name: '2BHK Apartment',
    description: 'Two-bedroom apartment with living and kitchen',
    category: 'residential',
    source: { kind: 'builder', build: build2BhkTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: '3bhk',
    name: '3BHK Apartment',
    description: 'Three-bedroom apartment with dining and kitchen',
    category: 'residential',
    source: { kind: 'builder', build: build3BhkTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'vastu-2bhk-indian',
    name: 'Vastu 2BHK Flat',
    description: 'Indian 2BHK with puja room, mandir, and Vastu-oriented labels',
    category: 'indian',
    source: { kind: 'builder', build: buildVastu2BhkIndianTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'courtyard-villa-indian',
    name: 'Courtyard Villa (Indian)',
    description: 'U-shaped villa with courtyard, tulsi, and puja room',
    category: 'indian',
    source: { kind: 'builder', build: buildCourtyardVillaIndianTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'bengaluru-3bhk',
    name: 'Bengaluru 3BHK Apartment',
    description: 'Compact Bengaluru apartment with service core and INR locale',
    category: 'indian',
    source: { kind: 'builder', build: buildBengaluruApartmentTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'family-home-4br',
    name: 'Family Home 4BR',
    description: 'Four-bedroom family home with living, dining, and kitchen',
    category: 'residential',
    source: { kind: 'builder', build: buildFamilyHome4BrTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'family-home-5br',
    name: 'Family Home 5BR',
    description: 'Large five-bedroom home with master suite',
    category: 'residential',
    source: { kind: 'builder', build: buildFamilyHome5BrTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'duplex-two-floor',
    name: 'Duplex Two Floor',
    description: 'Two-floor duplex with ground living and upper bedroom level',
    category: 'residential',
    source: { kind: 'builder', build: buildDuplexTwoFloorTemplate },
    surfaces: ['load-sample'],
  },
  {
    id: 'l-shape-home',
    name: 'L-Shape Home',
    description: 'L-shaped footprint with living and bedroom wings',
    category: 'shapes',
    source: { kind: 'builder', build: buildLShapeHomeTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 'u-shape-courtyard',
    name: 'U-Shape Courtyard',
    description: 'U-shaped home wrapping a central courtyard',
    category: 'shapes',
    source: { kind: 'builder', build: buildUShapeCourtyardTemplate },
    surfaces: ['load-sample', 'new-project'],
  },
  {
    id: 't-shape-wing',
    name: 'T-Shape Wing',
    description: 'Central bar with south-facing wing extension',
    category: 'shapes',
    source: { kind: 'builder', build: buildTShapeWingTemplate },
    surfaces: ['load-sample'],
  },
  {
    id: 'angled-modern',
    name: 'Angled Modern',
    description: 'Modern polygon footprint with angled exterior walls',
    category: 'shapes',
    source: { kind: 'builder', build: buildAngledModernTemplate },
    surfaces: ['load-sample'],
  },
  {
    id: 'furniture-showcase',
    name: 'Furniture Showcase',
    description: 'Open plan room displaying all furniture types',
    category: 'interior',
    source: { kind: 'json', path: '/samples/furniture-showcase.json' },
    surfaces: ['load-sample'],
  },
  {
    id: 'landscape-garden',
    name: 'Landscape Garden',
    description: 'Small home surrounded by trees, shrubs, and garden paths',
    category: 'landscape',
    source: { kind: 'json', path: '/samples/landscape-garden.json' },
    surfaces: ['load-sample'],
  },
  {
    id: 'terrain-garden',
    name: 'Terrain Garden',
    description: 'Stepped lawn, patio pad, and raised garden beds with landscape planting',
    category: 'landscape',
    source: { kind: 'json', path: '/samples/terrain-garden.json' },
    surfaces: ['load-sample'],
  },
  {
    id: 'mep-lighting-showcase',
    name: 'MEP & Lighting Showcase',
    description: 'Two-room shell with every MEP symbol and fixture type',
    category: 'mep',
    source: { kind: 'json', path: '/samples/mep-lighting-showcase.json' },
    surfaces: ['load-sample'],
  },
  {
    id: 'full-feature-showcase',
    name: 'Full Feature Showcase',
    description: 'Combined furniture, landscape, MEP, fixtures, labels, and dimensions',
    category: 'full',
    source: { kind: 'json', path: '/samples/full-feature-showcase.json' },
    surfaces: ['load-sample'],
  },
];

export const DEFAULT_SAMPLE_ID = 'sample-house-01';

export function getSampleDefinition(id: string): SampleDefinition | undefined {
  return SAMPLE_CATALOG.find((entry) => entry.id === id);
}

export function getSamplesForSurface(surface: SampleSurface): SampleDefinition[] {
  return SAMPLE_CATALOG.filter((entry) => entry.surfaces.includes(surface));
}

export function getNewProjectTemplates(): SampleDefinition[] {
  return getSamplesForSurface('new-project');
}

export function getSampleFeatureBadges(sample: SampleDefinition): string[] {
  const manifest = resolveSampleManifestSync(sample);
  const badges: string[] = [];
  if ((manifest.furniture?.length ?? 0) > 0) badges.push('Furniture');
  if ((manifest.landscapeElements?.length ?? 0) > 0) badges.push('Nature');
  if ((manifest.mepSymbols?.length ?? 0) > 0) badges.push('MEP');
  if ((manifest.fixtures?.length ?? 0) > 0) badges.push('Lighting');
  if ((manifest.floors?.length ?? 0) > 1) badges.push('Multi-floor');
  return badges;
}

export function getSampleStats(sample: SampleDefinition): { walls: number; openings: number } {
  const manifest = resolveSampleManifestSync(sample);
  return { walls: manifest.walls.length, openings: manifest.openings.length };
}

function resolveSampleManifestSync(sample: SampleDefinition): ProjectManifest {
  if (sample.source.kind === 'builder') {
    return sample.source.build();
  }
  return JSON_SAMPLE_MANIFESTS[sample.id] ?? sampleHouse01;
}

export async function loadSampleById(id: string): Promise<ProjectManifest> {
  const sample = getSampleDefinition(id);
  if (!sample) {
    throw new Error(`Unknown sample id: ${id}`);
  }

  if (sample.source.kind === 'builder') {
    return sample.source.build();
  }

  const bundled = JSON_SAMPLE_MANIFESTS[id];
  if (bundled) {
    return bundled;
  }

  const response = await fetch(sample.source.path);
  if (!response.ok) {
    throw new Error(`Failed to load sample ${id}: ${response.status}`);
  }
  return (await response.json()) as ProjectManifest;
}

export function buildSampleManifest(id: string): ProjectManifest {
  const builder = BUILDERS[id];
  if (!builder) {
    throw new Error(`No builder registered for sample id: ${id}`);
  }
  return builder();
}

export const TEMPLATE_IDS = getNewProjectTemplates().map((entry) => entry.id) as readonly string[];

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function getFloorTemplate(id: string): ProjectManifest {
  const sample = getSampleDefinition(id);
  if (!sample || sample.source.kind !== 'builder') {
    throw new Error(`Unknown floor template: ${id}`);
  }
  return sample.source.build();
}
