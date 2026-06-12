import { createProjectManifest } from '@/core/projectModel';
import type {
  DimensionAnnotation,
  FixtureItem,
  FurnitureItem,
  Label,
  LandscapeElement,
  MepSymbol,
  Opening,
  ProjectManifest,
  Room,
  TerrainPatch,
  Wall,
} from '@/types';

export const WALL_THICKNESS = 10;
export const WALL_HEIGHT = 240;
export const WALL_MATERIAL = 'material-concrete';
export const DEFAULT_FLOOR_MATERIAL = 'material-wood';

export const DOOR_DEFAULT = { width: 90, height: 210 };
export const WINDOW_DEFAULT = { width: 120, height: 120, sillHeight: 90 };

export interface RectShellOptions {
  idPrefix?: string;
  floorIndex?: number;
  doorWallId?: string;
  doorPosition?: number;
  windowWallIds?: string[];
  windowPositions?: number[];
}

export interface TemplateExtras {
  labels?: Label[];
  dimensions?: DimensionAnnotation[];
  rooms?: Room[];
  furniture?: FurnitureItem[];
  mepSymbols?: MepSymbol[];
  fixtures?: FixtureItem[];
  landscapeElements?: LandscapeElement[];
  terrain?: TerrainPatch[];
  floors?: ProjectManifest['floors'];
  activeFloorIndex?: number;
  floorMaterial?: string;
  description?: string;
}

function wallSegment(
  id: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
  floorIndex?: number,
): Wall {
  return {
    id,
    start,
    end,
    thickness: WALL_THICKNESS,
    height: WALL_HEIGHT,
    material: WALL_MATERIAL,
    ...(floorIndex !== undefined ? { floorIndex } : {}),
  };
}

export function rectShell(
  x: number,
  y: number,
  w: number,
  h: number,
  options: RectShellOptions = {},
): { walls: Wall[]; wallIds: Record<'n' | 'e' | 's' | 'w', string> } {
  const prefix = options.idPrefix ?? 'w';
  const fi = options.floorIndex;
  const ids = {
    n: `${prefix}-n`,
    e: `${prefix}-e`,
    s: `${prefix}-s`,
    w: `${prefix}-w`,
  };

  const walls: Wall[] = [
    wallSegment(ids.n, { x, y }, { x: x + w, y }, fi),
    wallSegment(ids.e, { x: x + w, y }, { x: x + w, y: y + h }, fi),
    wallSegment(ids.s, { x: x + w, y: y + h }, { x, y: y + h }, fi),
    wallSegment(ids.w, { x, y: y + h }, { x, y }, fi),
  ];

  return { walls, wallIds: ids };
}

export function partitionWall(
  id: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
  floorIndex?: number,
): Wall {
  return wallSegment(id, start, end, floorIndex);
}

export function defaultOpenings(
  wallIds: Record<'n' | 'e' | 's' | 'w', string>,
  options: {
    idPrefix?: string;
    doorWall?: keyof typeof wallIds;
    doorPosition?: number;
    windows?: { wall: keyof typeof wallIds; position: number }[];
  } = {},
): Opening[] {
  const prefix = options.idPrefix ?? 'op';
  const doorWall = options.doorWall ?? 'n';
  const doorPosition = options.doorPosition ?? 0.5;
  const windows = options.windows ?? [
    { wall: 'e', position: 0.5 },
    { wall: 'w', position: 0.5 },
  ];

  const openings: Opening[] = [
    {
      id: `${prefix}-door`,
      type: 'door',
      wallId: wallIds[doorWall],
      position: doorPosition,
      width: DOOR_DEFAULT.width,
      height: DOOR_DEFAULT.height,
    },
  ];

  windows.forEach((win, index) => {
    openings.push({
      id: `${prefix}-win-${index + 1}`,
      type: 'window',
      wallId: wallIds[win.wall],
      position: win.position,
      width: WINDOW_DEFAULT.width,
      height: WINDOW_DEFAULT.height,
      sillHeight: WINDOW_DEFAULT.sillHeight,
    });
  });

  return openings;
}

export function interiorDoor(id: string, wallId: string, position = 0.5): Opening {
  return {
    id,
    type: 'door',
    wallId,
    position,
    width: DOOR_DEFAULT.width,
    height: DOOR_DEFAULT.height,
  };
}

export function buildManifest(
  name: string,
  walls: Wall[],
  openings: Opening[],
  extras: TemplateExtras = {},
): ProjectManifest {
  return {
    ...createProjectManifest({
      name,
      description: extras.description,
      walls,
      openings,
      floorMaterial: extras.floorMaterial ?? DEFAULT_FLOOR_MATERIAL,
    }),
    ...(extras.labels ? { labels: extras.labels } : {}),
    ...(extras.dimensions ? { dimensions: extras.dimensions } : {}),
    ...(extras.rooms ? { rooms: extras.rooms } : {}),
    ...(extras.furniture ? { furniture: extras.furniture } : {}),
    ...(extras.mepSymbols ? { mepSymbols: extras.mepSymbols } : {}),
    ...(extras.fixtures ? { fixtures: extras.fixtures } : {}),
    ...(extras.landscapeElements ? { landscapeElements: extras.landscapeElements } : {}),
    ...(extras.terrain ? { terrain: extras.terrain } : {}),
    ...(extras.floors ? { floors: extras.floors } : {}),
    ...(extras.activeFloorIndex !== undefined ? { activeFloorIndex: extras.activeFloorIndex } : {}),
  };
}

export function placeAllFurniture(origin: { x: number; y: number }): FurnitureItem[] {
  return [
    { id: 'f-bed', type: 'bed', position: { x: origin.x + 80, y: origin.y + 60 }, width: 140, depth: 200, rotation: 0 },
    { id: 'f-sofa', type: 'sofa', position: { x: origin.x + 320, y: origin.y + 100 }, width: 180, depth: 90, rotation: 90 },
    { id: 'f-table', type: 'table', position: { x: origin.x + 200, y: origin.y + 120 }, width: 120, depth: 80, rotation: 0 },
    { id: 'f-chair', type: 'chair', position: { x: origin.x + 200, y: origin.y + 200 }, width: 50, depth: 50, rotation: 45 },
    { id: 'f-desk', type: 'desk', position: { x: origin.x + 420, y: origin.y + 180 }, width: 140, depth: 70, rotation: 0 },
    { id: 'f-wardrobe', type: 'wardrobe', position: { x: origin.x + 80, y: origin.y + 240 }, width: 120, depth: 60, rotation: 0 },
    { id: 'f-dining', type: 'dining_table', position: { x: origin.x + 260, y: origin.y + 280 }, width: 160, depth: 90, rotation: 0 },
    { id: 'f-nightstand', type: 'nightstand', position: { x: origin.x + 160, y: origin.y + 60 }, width: 50, depth: 40, rotation: 0 },
  ];
}

export function placeLandscapeRing(center: { x: number; y: number }): LandscapeElement[] {
  const trees = [
    { x: center.x - 120, y: center.y - 80 },
    { x: center.x + 120, y: center.y - 80 },
    { x: center.x - 120, y: center.y + 80 },
    { x: center.x + 120, y: center.y + 80 },
  ];
  const pines = [
    { x: center.x, y: center.y - 140 },
    { x: center.x, y: center.y + 140 },
  ];
  const shrubs = [
    { x: center.x - 60, y: center.y - 120 },
    { x: center.x + 60, y: center.y - 120 },
    { x: center.x - 60, y: center.y + 120 },
    { x: center.x + 60, y: center.y + 120 },
  ];
  const flowers = [
    { x: center.x - 90, y: center.y - 40 },
    { x: center.x + 90, y: center.y + 40 },
  ];
  const rocks = [
    { x: center.x + 90, y: center.y - 40, width: 24, depth: 18 },
    { x: center.x - 90, y: center.y + 40, width: 28, depth: 20 },
  ];

  return [
    ...trees.map((pos, i) => ({ id: `ls-tree-${i + 1}`, type: 'tree', position: pos })),
    ...pines.map((pos, i) => ({ id: `ls-pine-${i + 1}`, type: 'pine', position: pos })),
    ...shrubs.map((pos, i) => ({ id: `ls-shrub-${i + 1}`, type: 'shrub', position: pos })),
    ...flowers.map((pos, i) => ({ id: `ls-flower-${i + 1}`, type: 'flower', position: pos })),
    ...rocks.map((pos, i) => ({
      id: `ls-rock-${i + 1}`,
      type: 'rock',
      position: { x: pos.x, y: pos.y },
      width: pos.width,
      depth: pos.depth,
    })),
    { id: 'ls-path-1', type: 'path', position: { x: center.x - 40, y: center.y - 160 }, width: 32, depth: 12 },
    { id: 'ls-path-2', type: 'path', position: { x: center.x + 40, y: center.y - 160 }, width: 32, depth: 12 },
    {
      id: 'ls-water-1',
      type: 'water',
      position: { x: center.x, y: center.y + 180 },
      width: 100,
      depth: 70,
    },
  ];
}

export function placeMepGrid(origin: { x: number; y: number }): MepSymbol[] {
  const types: MepSymbol['type'][] = ['outlet', 'switch', 'hvac', 'panel'];
  return types.map((type, i) => ({
    id: `mep-${type}`,
    type,
    position: { x: origin.x + 40 + i * 50, y: origin.y + 40 },
  }));
}

export function placeFixtures(origin: { x: number; y: number }): FixtureItem[] {
  const types: FixtureItem['type'][] = ['point', 'spot', 'ceiling'];
  return types.map((type, i) => ({
    id: `fix-${type}`,
    type,
    position: { x: origin.x + 100 + i * 80, y: origin.y + 80 },
    intensity: 1,
  }));
}

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

export function lShapeWalls(
  x: number,
  y: number,
  outerW: number,
  outerH: number,
  cutW: number,
  cutH: number,
  idPrefix = 'l',
): Wall[] {
  const x2 = x + outerW;
  const y2 = y + outerH;
  const cx = x2 - cutW;
  const cy = y + cutH;

  return [
    wallSegment(`${idPrefix}-n`, { x, y }, { x: x2, y }),
    wallSegment(`${idPrefix}-e-top`, { x: x2, y }, { x: x2, y: cy }),
    wallSegment(`${idPrefix}-e-inner`, { x: cx, y: cy }, { x: cx, y: y2 }),
    wallSegment(`${idPrefix}-s`, { x: cx, y: y2 }, { x, y: y2 }),
    wallSegment(`${idPrefix}-w`, { x, y: y2 }, { x, y }),
    wallSegment(`${idPrefix}-inner-h`, { x: cx, y: cy }, { x: x2, y: cy }),
    wallSegment(`${idPrefix}-inner-v`, { x: cx, y }, { x: cx, y: cy }),
  ];
}

export function uShapeWalls(
  x: number,
  y: number,
  outerW: number,
  outerH: number,
  courtyardW: number,
  courtyardDepth: number,
  idPrefix = 'u',
): Wall[] {
  const x2 = x + outerW;
  const y2 = y + outerH;
  const cx1 = x + (outerW - courtyardW) / 2;
  const cx2 = cx1 + courtyardW;
  const cy = y + courtyardDepth;

  return [
    wallSegment(`${idPrefix}-n-w`, { x, y }, { x: cx1, y }),
    wallSegment(`${idPrefix}-n-e`, { x: cx2, y }, { x: x2, y }),
    wallSegment(`${idPrefix}-e`, { x: x2, y }, { x: x2, y: y2 }),
    wallSegment(`${idPrefix}-s`, { x: x2, y: y2 }, { x, y: y2 }),
    wallSegment(`${idPrefix}-w`, { x, y: y2 }, { x, y }),
    wallSegment(`${idPrefix}-court-w`, { x: cx1, y: cy }, { x: cx1, y }),
    wallSegment(`${idPrefix}-court-e`, { x: cx2, y }, { x: cx2, y: cy }),
    wallSegment(`${idPrefix}-court-s`, { x: cx1, y: cy }, { x: cx2, y: cy }),
  ];
}

export function tShapeWalls(
  x: number,
  y: number,
  barW: number,
  barH: number,
  wingW: number,
  wingH: number,
  idPrefix = 't',
): Wall[] {
  const bar = rectShell(x, y, barW, barH, { idPrefix: `${idPrefix}-bar` });
  const wingX = x + (barW - wingW) / 2;
  const wingY = y + barH;
  const wing = rectShell(wingX, wingY, wingW, wingH, { idPrefix: `${idPrefix}-wing` });

  return [...bar.walls, ...wing.walls.filter((w) => w.id !== `${idPrefix}-wing-n`)];
}

export function angledModernWalls(idPrefix = 'ang'): Wall[] {
  return [
    wallSegment(`${idPrefix}-1`, { x: 220, y: 220 }, { x: 520, y: 200 }),
    wallSegment(`${idPrefix}-2`, { x: 520, y: 200 }, { x: 620, y: 380 }),
    wallSegment(`${idPrefix}-3`, { x: 620, y: 380 }, { x: 480, y: 520 }),
    wallSegment(`${idPrefix}-4`, { x: 480, y: 520 }, { x: 240, y: 500 }),
    wallSegment(`${idPrefix}-5`, { x: 240, y: 500 }, { x: 220, y: 220 }),
    wallSegment(`${idPrefix}-diag`, { x: 380, y: 280 }, { x: 380, y: 440 }),
  ];
}

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

export function buildStudioTemplate(): ProjectManifest {
  const { walls, wallIds } = rectShell(280, 260, 320, 240);
  return buildManifest('Studio Apartment', walls, defaultOpenings(wallIds, { doorWall: 's' }), {
    description: 'Compact studio with living and kitchen zones',
    labels: [
      { id: 'l1', text: 'Living', position: { x: 400, y: 340 } },
      { id: 'l2', text: 'Kitchen', position: { x: 480, y: 420 } },
    ],
  });
}

export function build2BhkTemplate(): ProjectManifest {
  const { walls: shell, wallIds } = rectShell(240, 220, 420, 300);
  const mid = partitionWall('w-mid', { x: 430, y: 220 }, { x: 430, y: 380 });
  const walls = [...shell, mid];
  const openings = [
    ...defaultOpenings(wallIds, { doorWall: 's', doorPosition: 0.35, windows: [{ wall: 'e', position: 0.3 }, { wall: 'e', position: 0.75 }] }),
    interiorDoor('d2', 'w-mid', 0.6),
  ];

  return buildManifest('2BHK Apartment', walls, openings, {
    description: 'Two-bedroom apartment with living and kitchen',
    labels: [
      { id: 'l1', text: 'Living', position: { x: 340, y: 340 } },
      { id: 'l2', text: 'Bedroom 1', position: { x: 510, y: 300 } },
      { id: 'l3', text: 'Bedroom 2', position: { x: 510, y: 440 } },
      { id: 'l4', text: 'Kitchen', position: { x: 300, y: 440 } },
    ],
    furniture: [
      { id: 'f1', type: 'sofa', position: { x: 330, y: 360 } },
      { id: 'f2', type: 'bed', position: { x: 510, y: 310 } },
    ],
  });
}

export function build3BhkTemplate(): ProjectManifest {
  const { walls: shell, wallIds } = rectShell(200, 180, 520, 360);
  const walls = [
    ...shell,
    partitionWall('w-v1', { x: 460, y: 180 }, { x: 460, y: 400 }),
    partitionWall('w-v2', { x: 580, y: 180 }, { x: 580, y: 400 }),
    partitionWall('w-h1', { x: 200, y: 400 }, { x: 720, y: 400 }),
  ];
  const openings = [
    ...defaultOpenings(wallIds, {
      doorWall: 's',
      doorPosition: 0.25,
      windows: [
        { wall: 'e', position: 0.2 },
        { wall: 'e', position: 0.55 },
        { wall: 'e', position: 0.85 },
      ],
    }),
    interiorDoor('d2', 'w-v1', 0.5),
    interiorDoor('d3', 'w-v2', 0.5),
  ];

  return buildManifest('3BHK Apartment', walls, openings, {
    description: 'Three-bedroom apartment with dining and kitchen',
    labels: [
      { id: 'l1', text: 'Living', position: { x: 330, y: 290 } },
      { id: 'l2', text: 'Dining', position: { x: 330, y: 440 } },
      { id: 'l3', text: 'Master Bedroom', position: { x: 640, y: 270 } },
      { id: 'l4', text: 'Bedroom 2', position: { x: 520, y: 270 } },
      { id: 'l5', text: 'Bedroom 3', position: { x: 520, y: 440 } },
      { id: 'l6', text: 'Kitchen', position: { x: 260, y: 440 } },
    ],
    furniture: [
      { id: 'f1', type: 'sofa', position: { x: 320, y: 300 } },
      { id: 'f2', type: 'bed', position: { x: 640, y: 260 } },
      { id: 'f3', type: 'bed', position: { x: 520, y: 260 } },
    ],
  });
}

export function buildFamilyHome4BrTemplate(): ProjectManifest {
  const { walls: shell, wallIds } = rectShell(180, 160, 600, 450);
  const walls = [
    ...shell,
    partitionWall('fh-v1', { x: 480, y: 160 }, { x: 480, y: 385 }),
    partitionWall('fh-h1', { x: 180, y: 385 }, { x: 780, y: 385 }),
  ];
  const openings = [
    ...defaultOpenings(wallIds, {
      doorWall: 's',
      doorPosition: 0.3,
      windows: [
        { wall: 'e', position: 0.25 },
        { wall: 'e', position: 0.6 },
        { wall: 'w', position: 0.4 },
      ],
    }),
    interiorDoor('fh-d2', 'fh-v1', 0.55),
    interiorDoor('fh-d3', 'fh-h1', 0.25),
    interiorDoor('fh-d4', 'fh-h1', 0.65),
  ];

  return buildManifest('Family Home 4BR', walls, openings, {
    description: 'Four-bedroom family home with living, dining, and kitchen',
    labels: [
      { id: 'fh-l1', text: 'Living', position: { x: 330, y: 300 } },
      { id: 'fh-l2', text: 'Dining', position: { x: 330, y: 470 } },
      { id: 'fh-l3', text: 'Kitchen', position: { x: 260, y: 530 } },
      { id: 'fh-l4', text: 'Bedroom 1', position: { x: 620, y: 280 } },
      { id: 'fh-l5', text: 'Bedroom 2', position: { x: 620, y: 470 } },
      { id: 'fh-l6', text: 'Bedroom 3', position: { x: 480, y: 470 } },
    ],
    furniture: [
      { id: 'fh-f1', type: 'sofa', position: { x: 320, y: 310 } },
      { id: 'fh-f2', type: 'bed', position: { x: 620, y: 270 } },
      { id: 'fh-f3', type: 'table', position: { x: 330, y: 460 } },
    ],
  });
}

export function buildFamilyHome5BrTemplate(): ProjectManifest {
  const { walls: shell, wallIds } = rectShell(140, 140, 700, 500);
  const walls = [
    ...shell,
    partitionWall('f5-v1', { x: 440, y: 140 }, { x: 440, y: 390 }),
    partitionWall('f5-v2', { x: 620, y: 140 }, { x: 620, y: 390 }),
    partitionWall('f5-h1', { x: 140, y: 390 }, { x: 840, y: 390 }),
    partitionWall('f5-h2', { x: 440, y: 390 }, { x: 440, y: 640 }),
  ];
  const openings = [
    ...defaultOpenings(wallIds, {
      doorWall: 's',
      doorPosition: 0.2,
      windows: [
        { wall: 'e', position: 0.2 },
        { wall: 'e', position: 0.5 },
        { wall: 'e', position: 0.8 },
        { wall: 'w', position: 0.5 },
      ],
    }),
    interiorDoor('f5-d2', 'f5-v1', 0.5),
    interiorDoor('f5-d3', 'f5-v2', 0.5),
    interiorDoor('f5-d4', 'f5-h1', 0.2),
    interiorDoor('f5-d5', 'f5-h1', 0.55),
    interiorDoor('f5-d6', 'f5-h2', 0.4),
  ];

  return buildManifest('Family Home 5BR', walls, openings, {
    description: 'Large five-bedroom home with master suite and cross partitions',
    labels: [
      { id: 'f5-l1', text: 'Living', position: { x: 290, y: 280 } },
      { id: 'f5-l2', text: 'Dining', position: { x: 290, y: 480 } },
      { id: 'f5-l3', text: 'Kitchen', position: { x: 220, y: 540 } },
      { id: 'f5-l4', text: 'Master Suite', position: { x: 720, y: 260 } },
      { id: 'f5-l5', text: 'Bedroom 2', position: { x: 530, y: 260 } },
      { id: 'f5-l6', text: 'Bedroom 3', position: { x: 530, y: 480 } },
      { id: 'f5-l7', text: 'Bedroom 4', position: { x: 720, y: 480 } },
      { id: 'f5-l8', text: 'Bedroom 5', position: { x: 530, y: 580 } },
    ],
    furniture: [
      { id: 'f5-f1', type: 'sofa', position: { x: 280, y: 290 } },
      { id: 'f5-f2', type: 'bed', position: { x: 720, y: 250 } },
      { id: 'f5-f3', type: 'bed', position: { x: 530, y: 250 } },
    ],
  });
}

export function buildDuplexTwoFloorTemplate(): ProjectManifest {
  const ground = rectShell(260, 240, 360, 280, { idPrefix: 'g', floorIndex: 0 });
  const upper = rectShell(260, 240, 360, 280, { idPrefix: 'u', floorIndex: 1 });
  const stairsMid = partitionWall('g-stair', { x: 440, y: 240 }, { x: 440, y: 400 }, 0);

  const walls = [...ground.walls, stairsMid, ...upper.walls];
  const openings = [
    ...defaultOpenings(ground.wallIds, { idPrefix: 'g-op', doorWall: 's' }),
    {
      id: 'u-win-1',
      type: 'window' as const,
      wallId: 'u-e',
      position: 0.5,
      width: WINDOW_DEFAULT.width,
      height: WINDOW_DEFAULT.height,
      sillHeight: WINDOW_DEFAULT.sillHeight,
    },
  ];

  return buildManifest('Duplex Two Floor', walls, openings, {
    description: 'Two-floor duplex with ground living and upper bedroom level',
    floors: [
      { id: 'floor-g', name: 'Ground Floor', elevation: 0 },
      { id: 'floor-1', name: 'First Floor', elevation: 280 },
    ],
    activeFloorIndex: 0,
    labels: [
      { id: 'dx-l1', text: 'Living (Ground)', position: { x: 360, y: 340 } },
      { id: 'dx-l2', text: 'Bedroom (Upper)', position: { x: 360, y: 360 } },
    ],
    furniture: [{ id: 'dx-f1', type: 'sofa', position: { x: 340, y: 350 } }],
  });
}

export function buildLShapeHomeTemplate(): ProjectManifest {
  const walls = lShapeWalls(200, 180, 550, 550, 220, 220);
  const openings: Opening[] = [
    { id: 'ls-d1', type: 'door', wallId: 'l-s', position: 0.35, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    { id: 'ls-w1', type: 'window', wallId: 'l-e-top', position: 0.5, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    { id: 'ls-w2', type: 'window', wallId: 'l-w', position: 0.4, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    interiorDoor('ls-d2', 'l-inner-v', 0.5),
  ];

  return buildManifest('L-Shape Home', walls, openings, {
    description: 'L-shaped footprint with living wing and bedroom wing',
    labels: [
      { id: 'ls-l1', text: 'Living', position: { x: 380, y: 320 } },
      { id: 'ls-l2', text: 'Kitchen', position: { x: 300, y: 400 } },
      { id: 'ls-l3', text: 'Bedroom', position: { x: 580, y: 480 } },
      { id: 'ls-l4', text: 'Courtyard Cut', position: { x: 620, y: 280 } },
    ],
    furniture: [
      { id: 'ls-f1', type: 'sofa', position: { x: 370, y: 330 } },
      { id: 'ls-f2', type: 'bed', position: { x: 580, y: 470 } },
    ],
  });
}

export function buildUShapeCourtyardTemplate(): ProjectManifest {
  const walls = uShapeWalls(160, 160, 640, 520, 280, 180);
  const openings: Opening[] = [
    { id: 'us-d1', type: 'door', wallId: 'u-s', position: 0.7, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    { id: 'us-w1', type: 'window', wallId: 'u-e', position: 0.3, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    { id: 'us-w2', type: 'window', wallId: 'u-w', position: 0.3, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    interiorDoor('us-d2', 'u-court-s', 0.5),
  ];

  return buildManifest('U-Shape Courtyard', walls, openings, {
    description: 'U-shaped home wrapping a central courtyard',
    labels: [
      { id: 'us-l1', text: 'West Wing', position: { x: 280, y: 400 } },
      { id: 'us-l2', text: 'East Wing', position: { x: 680, y: 400 } },
      { id: 'us-l3', text: 'Courtyard', position: { x: 480, y: 260 } },
    ],
    landscapeElements: [
      { id: 'us-tree-1', type: 'tree', position: { x: 480, y: 250 } },
      { id: 'us-shrub-1', type: 'shrub', position: { x: 440, y: 280 } },
      { id: 'us-shrub-2', type: 'shrub', position: { x: 520, y: 280 } },
    ],
  });
}

export function buildTShapeWingTemplate(): ProjectManifest {
  const walls = tShapeWalls(280, 200, 400, 180, 200, 200);
  const openings: Opening[] = [
    { id: 'ts-d1', type: 'door', wallId: 't-bar-s', position: 0.5, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    { id: 'ts-w1', type: 'window', wallId: 't-bar-e', position: 0.5, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    { id: 'ts-w2', type: 'window', wallId: 't-wing-e', position: 0.5, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
  ];

  return buildManifest('T-Shape Wing', walls, openings, {
    description: 'Central bar with south-facing wing extension',
    labels: [
      { id: 'ts-l1', text: 'Main Bar', position: { x: 480, y: 280 } },
      { id: 'ts-l2', text: 'South Wing', position: { x: 480, y: 420 } },
    ],
    furniture: [{ id: 'ts-f1', type: 'table', position: { x: 480, y: 290 } }],
  });
}

export function buildAngledModernTemplate(): ProjectManifest {
  const walls = angledModernWalls();
  const openings: Opening[] = [
    { id: 'am-d1', type: 'door', wallId: 'ang-4', position: 0.35, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    { id: 'am-w1', type: 'window', wallId: 'ang-2', position: 0.5, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    { id: 'am-w2', type: 'window', wallId: 'ang-1', position: 0.6, width: WINDOW_DEFAULT.width, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
    interiorDoor('am-d2', 'ang-diag', 0.5),
  ];

  return buildManifest('Angled Modern', walls, openings, {
    description: 'Modern polygon footprint with angled exterior walls',
    labels: [
      { id: 'am-l1', text: 'Open Plan', position: { x: 400, y: 340 } },
      { id: 'am-l2', text: 'Study Nook', position: { x: 500, y: 420 } },
    ],
  });
}

export function buildFurnitureShowcaseTemplate(): ProjectManifest {
  const { walls, wallIds } = rectShell(160, 140, 520, 380);
  return buildManifest('Furniture Showcase', walls, defaultOpenings(wallIds, { doorWall: 's' }), {
    description: 'Open plan room displaying all furniture types',
    labels: [{ id: 'fs-l1', text: 'Showroom', position: { x: 420, y: 320 } }],
    furniture: placeAllFurniture({ x: 200, y: 180 }),
  });
}

export function buildLandscapeGardenTemplate(): ProjectManifest {
  const { walls, wallIds } = rectShell(280, 260, 320, 240);
  const center = { x: 440, y: 380 };
  return buildManifest('Landscape Garden', walls, defaultOpenings(wallIds, { doorWall: 'n' }), {
    description: 'Small home surrounded by trees, shrubs, and garden paths',
    labels: [
      { id: 'lg-l1', text: 'Home', position: { x: 440, y: 360 } },
      { id: 'lg-l2', text: 'Garden', position: { x: 440, y: 520 } },
    ],
    landscapeElements: placeLandscapeRing(center),
  });
}

export function buildTerrainGardenTemplate(): ProjectManifest {
  const { walls, wallIds } = rectShell(280, 260, 320, 240);
  const center = { x: 440, y: 380 };
  return buildManifest('Terrain Garden', walls, defaultOpenings(wallIds, { doorWall: 'n' }), {
    description: 'Stepped lawn, patio pad, and raised garden beds with landscape planting',
    labels: [
      { id: 'tg-l1', text: 'Home', position: { x: 440, y: 360 } },
      { id: 'tg-l2', text: 'Raised Beds', position: { x: 440, y: 540 } },
    ],
    landscapeElements: placeLandscapeRing(center),
    terrain: [
      {
        id: 'tg-lawn',
        elevation: 0,
        points: [
          { x: 200, y: 180 },
          { x: 680, y: 180 },
          { x: 680, y: 620 },
          { x: 200, y: 620 },
        ],
      },
      {
        id: 'tg-patio',
        elevation: 30,
        points: [
          { x: 360, y: 420 },
          { x: 520, y: 420 },
          { x: 520, y: 500 },
          { x: 360, y: 500 },
        ],
      },
      {
        id: 'tg-bed',
        elevation: 60,
        points: [
          { x: 320, y: 540 },
          { x: 560, y: 540 },
          { x: 560, y: 600 },
          { x: 320, y: 600 },
        ],
      },
    ],
  });
}

export function buildMepLightingShowcaseTemplate(): ProjectManifest {
  const { walls: shell, wallIds } = rectShell(220, 200, 440, 280);
  const mid = partitionWall('mep-mid', { x: 440, y: 200 }, { x: 440, y: 380 });
  const origin = { x: 280, y: 260 };
  return buildManifest('MEP & Lighting Showcase', [...shell, mid], [
    ...defaultOpenings(wallIds, { doorWall: 's' }),
    interiorDoor('mep-d2', 'mep-mid', 0.5),
  ], {
    description: 'Two-room shell with every MEP symbol and fixture type',
    labels: [
      { id: 'mep-l1', text: 'Room A', position: { x: 330, y: 300 } },
      { id: 'mep-l2', text: 'Room B', position: { x: 530, y: 300 } },
    ],
    mepSymbols: placeMepGrid(origin),
    fixtures: placeFixtures({ x: 500, y: 260 }),
  });
}

export function buildFullFeatureShowcaseTemplate(): ProjectManifest {
  const { walls, wallIds } = rectShell(180, 160, 560, 400);
  const center = { x: 460, y: 360 };
  return buildManifest('Full Feature Showcase', walls, defaultOpenings(wallIds, { doorWall: 's' }), {
    description: 'Combined furniture, landscape, MEP, fixtures, labels, and dimensions',
    labels: [
      { id: 'ff-l1', text: 'Living', position: { x: 360, y: 300 } },
      { id: 'ff-l2', text: 'Garden Edge', position: { x: 460, y: 520 } },
    ],
    dimensions: [{ id: 'ff-d1', start: { x: 180, y: 160 }, end: { x: 740, y: 160 }, offset: 24 }],
    furniture: placeAllFurniture({ x: 220, y: 200 }),
    landscapeElements: placeLandscapeRing(center),
    mepSymbols: placeMepGrid({ x: 600, y: 280 }),
    fixtures: placeFixtures({ x: 360, y: 400 }),
  });
}
