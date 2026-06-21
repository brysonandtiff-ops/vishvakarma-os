import type { ProjectManifest, Wall } from '@/types';
import {
  DOOR_DEFAULT,
  WINDOW_DEFAULT,
  buildManifest,
  defaultOpenings,
  interiorDoor,
  partitionWall,
  placeLandscapeRing,
  rectShell,
} from '@/core/templateBuilder';

function addBathLabels(prefix: string, positions: { x: number; y: number }[]) {
  return positions.map((position, index) => ({
    id: `${prefix}-bath-${index + 1}`,
    text: `Bath ${index + 1}`,
    position,
  }));
}

function skylightFixtures(prefix: string, positions: { x: number; y: number }[]) {
  return positions.map((position, index) => ({
    id: `${prefix}-sky-${index + 1}`,
    type: 'ceiling' as const,
    position,
    intensity: 1.2,
  }));
}

function serviceMep(prefix: string, origin: { x: number; y: number }) {
  return [
    { id: `${prefix}-panel`, type: 'panel' as const, position: { x: origin.x, y: origin.y } },
    { id: `${prefix}-hvac`, type: 'hvac' as const, position: { x: origin.x + 80, y: origin.y } },
    { id: `${prefix}-outlet`, type: 'outlet' as const, position: { x: origin.x + 160, y: origin.y } },
  ];
}

function mergeShells(...shells: Wall[][]): Wall[] {
  return shells.flat();
}

export function buildFiveThreeSkyCourtTemplate(): ProjectManifest {
  const main = rectShell(120, 120, 780, 500, { idPrefix: 'ft-main' });
  const guest = rectShell(120, 650, 360, 210, { idPrefix: 'ft-guest' });
  const studio = rectShell(560, 650, 340, 210, { idPrefix: 'ft-studio' });
  const walls = [
    ...mergeShells(main.walls, guest.walls, studio.walls),
    partitionWall('ft-spine-a', { x: 390, y: 120 }, { x: 390, y: 620 }),
    partitionWall('ft-spine-b', { x: 640, y: 120 }, { x: 640, y: 620 }),
    partitionWall('ft-gallery', { x: 120, y: 360 }, { x: 900, y: 360 }),
    partitionWall('ft-service-core', { x: 640, y: 360 }, { x: 900, y: 360 }),
  ];

  return buildManifest('5-3 Sky Court Estate', walls, [
    ...defaultOpenings(main.wallIds, { idPrefix: 'ft-main-op', doorWall: 's', doorPosition: 0.42 }),
    ...defaultOpenings(guest.wallIds, { idPrefix: 'ft-guest-op', doorWall: 'n', doorPosition: 0.45 }),
    ...defaultOpenings(studio.wallIds, { idPrefix: 'ft-studio-op', doorWall: 'n', doorPosition: 0.55 }),
    interiorDoor('ft-d-suite-a', 'ft-spine-a', 0.35),
    interiorDoor('ft-d-suite-b', 'ft-spine-b', 0.35),
    interiorDoor('ft-d-gallery-a', 'ft-gallery', 0.26),
    interiorDoor('ft-d-gallery-b', 'ft-gallery', 0.67),
  ], {
    description: 'Unusual five-bedroom, three-bath sky-court estate with two detached pods and central gallery spine.',
    labels: [
      { id: 'ft-l-living', text: 'Great Room', position: { x: 250, y: 250 } },
      { id: 'ft-l-kitchen', text: 'Chef Kitchen', position: { x: 250, y: 465 } },
      { id: 'ft-l-master', text: 'Master Suite', position: { x: 520, y: 245 } },
      { id: 'ft-l-bed2', text: 'Bedroom 2', position: { x: 755, y: 245 } },
      { id: 'ft-l-bed3', text: 'Bedroom 3', position: { x: 520, y: 485 } },
      { id: 'ft-l-bed4', text: 'Guest Pod', position: { x: 300, y: 755 } },
      { id: 'ft-l-bed5', text: 'Studio Pod', position: { x: 730, y: 755 } },
      { id: 'ft-l-court', text: 'Sky Court', position: { x: 510, y: 640 } },
      ...addBathLabels('ft', [{ x: 760, y: 450 }, { x: 430, y: 450 }, { x: 670, y: 705 }]),
    ],
    furniture: [
      { id: 'ft-sofa', type: 'sofa', position: { x: 250, y: 260 }, width: 220, depth: 95, rotation: 0 },
      { id: 'ft-dining', type: 'dining_table', position: { x: 285, y: 465 }, width: 170, depth: 95, rotation: 0 },
      { id: 'ft-bed-master', type: 'bed', position: { x: 520, y: 245 }, width: 180, depth: 210, rotation: 90 },
      { id: 'ft-bed-guest', type: 'bed', position: { x: 300, y: 755 }, width: 160, depth: 200, rotation: 0 },
      { id: 'ft-bed-studio', type: 'bed', position: { x: 730, y: 755 }, width: 160, depth: 200, rotation: 0 },
    ],
    fixtures: skylightFixtures('ft', [{ x: 510, y: 340 }, { x: 510, y: 640 }, { x: 735, y: 755 }]),
    mepSymbols: serviceMep('ft', { x: 710, y: 520 }),
    landscapeElements: placeLandscapeRing({ x: 510, y: 640 }),
    dimensions: [{ id: 'ft-dim-main', start: { x: 120, y: 120 }, end: { x: 900, y: 120 }, offset: 34 }],
    floorMaterial: 'material-stone',
    northOrientation: 18,
  });
}

export function buildSixThreeAtriumTemplate(): ProjectManifest {
  const west = rectShell(90, 150, 360, 560, { idPrefix: 'sx-west' });
  const east = rectShell(610, 150, 360, 560, { idPrefix: 'sx-east' });
  const bridge = rectShell(450, 310, 160, 230, { idPrefix: 'sx-bridge' });
  const walls = [
    ...mergeShells(west.walls, east.walls, bridge.walls),
    partitionWall('sx-west-split-a', { x: 90, y: 335 }, { x: 450, y: 335 }),
    partitionWall('sx-west-split-b', { x: 90, y: 520 }, { x: 450, y: 520 }),
    partitionWall('sx-east-split-a', { x: 610, y: 335 }, { x: 970, y: 335 }),
    partitionWall('sx-east-split-b', { x: 610, y: 520 }, { x: 970, y: 520 }),
  ];

  return buildManifest('6-3 Atrium Wing House', walls, [
    ...defaultOpenings(west.wallIds, { idPrefix: 'sx-west-op', doorWall: 's', doorPosition: 0.5 }),
    ...defaultOpenings(east.wallIds, { idPrefix: 'sx-east-op', doorWall: 's', doorPosition: 0.5 }),
    { id: 'sx-bridge-door', type: 'door', wallId: 'sx-bridge-s', position: 0.5, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    { id: 'sx-glass-n', type: 'window', wallId: 'sx-bridge-n', position: 0.5, width: 150, height: WINDOW_DEFAULT.height, sillHeight: WINDOW_DEFAULT.sillHeight },
  ], {
    description: 'Six-bedroom, three-bath atrium plan with twin sleeping wings and a bridge gallery for premium 3D viewing.',
    labels: [
      { id: 'sx-l-atrium', text: 'Glass Atrium', position: { x: 530, y: 425 } },
      { id: 'sx-l-family', text: 'Family Hall', position: { x: 270, y: 245 } },
      { id: 'sx-l-library', text: 'Library', position: { x: 790, y: 245 } },
      { id: 'sx-l-bed1', text: 'Bedroom 1', position: { x: 270, y: 430 } },
      { id: 'sx-l-bed2', text: 'Bedroom 2', position: { x: 270, y: 615 } },
      { id: 'sx-l-bed3', text: 'Bedroom 3', position: { x: 790, y: 430 } },
      { id: 'sx-l-bed4', text: 'Bedroom 4', position: { x: 790, y: 615 } },
      { id: 'sx-l-bed5', text: 'Guest Suite', position: { x: 205, y: 615 } },
      { id: 'sx-l-bed6', text: 'Studio Suite', position: { x: 860, y: 615 } },
      ...addBathLabels('sx', [{ x: 390, y: 430 }, { x: 665, y: 430 }, { x: 530, y: 550 }]),
    ],
    furniture: [
      { id: 'sx-f-sofa', type: 'sofa', position: { x: 270, y: 250 }, width: 200, depth: 90, rotation: 0 },
      { id: 'sx-f-desk', type: 'desk', position: { x: 790, y: 245 }, width: 150, depth: 80, rotation: 0 },
      { id: 'sx-f-bed-a', type: 'bed', position: { x: 270, y: 430 }, width: 150, depth: 200, rotation: 0 },
      { id: 'sx-f-bed-b', type: 'bed', position: { x: 790, y: 430 }, width: 150, depth: 200, rotation: 0 },
    ],
    fixtures: skylightFixtures('sx', [{ x: 530, y: 425 }, { x: 270, y: 245 }, { x: 790, y: 245 }]),
    mepSymbols: serviceMep('sx', { x: 500, y: 575 }),
    landscapeElements: placeLandscapeRing({ x: 530, y: 425 }),
    dimensions: [{ id: 'sx-dim-span', start: { x: 90, y: 150 }, end: { x: 970, y: 150 }, offset: 38 }],
    floorMaterial: 'material-concrete',
    northOrientation: 342,
  });
}

export function buildDualKey3242Template(): ProjectManifest {
  const front = rectShell(120, 150, 420, 360, { idPrefix: 'dk-front' });
  const rear = rectShell(580, 120, 440, 440, { idPrefix: 'dk-rear' });
  const court = rectShell(395, 560, 300, 180, { idPrefix: 'dk-court' });
  const walls = [
    ...mergeShells(front.walls, rear.walls, court.walls),
    partitionWall('dk-front-bed-a', { x: 330, y: 150 }, { x: 330, y: 360 }),
    partitionWall('dk-front-bed-b', { x: 120, y: 360 }, { x: 540, y: 360 }),
    partitionWall('dk-rear-bed-a', { x: 760, y: 120 }, { x: 760, y: 390 }),
    partitionWall('dk-rear-bed-b', { x: 580, y: 390 }, { x: 1020, y: 390 }),
  ];

  return buildManifest('3-2 / 4-2 Dual-Key Courtyard', walls, [
    ...defaultOpenings(front.wallIds, { idPrefix: 'dk-front-op', doorWall: 's', doorPosition: 0.28 }),
    ...defaultOpenings(rear.wallIds, { idPrefix: 'dk-rear-op', doorWall: 's', doorPosition: 0.72 }),
    { id: 'dk-court-door', type: 'door', wallId: 'dk-court-n', position: 0.5, width: DOOR_DEFAULT.width, height: DOOR_DEFAULT.height },
    interiorDoor('dk-front-suite', 'dk-front-bed-a', 0.55),
    interiorDoor('dk-rear-suite', 'dk-rear-bed-a', 0.55),
  ], {
    description: 'Unusual dual-key compound: front 3 bed / 2 bath home, rear 4 bed / 2 bath home, joined by a shared courtyard spine.',
    labels: [
      { id: 'dk-l-front', text: '3-2 Front Home', position: { x: 255, y: 260 } },
      { id: 'dk-l-front-bed1', text: 'Front Bed 1', position: { x: 430, y: 250 } },
      { id: 'dk-l-front-bed2', text: 'Front Bed 2', position: { x: 245, y: 430 } },
      { id: 'dk-l-front-bed3', text: 'Front Bed 3', position: { x: 430, y: 430 } },
      { id: 'dk-l-rear', text: '4-2 Rear Home', position: { x: 685, y: 260 } },
      { id: 'dk-l-rear-bed1', text: 'Rear Bed 1', position: { x: 890, y: 250 } },
      { id: 'dk-l-rear-bed2', text: 'Rear Bed 2', position: { x: 685, y: 465 } },
      { id: 'dk-l-rear-bed3', text: 'Rear Bed 3', position: { x: 890, y: 465 } },
      { id: 'dk-l-rear-bed4', text: 'Rear Studio', position: { x: 940, y: 465 } },
      { id: 'dk-l-court', text: 'Shared Courtyard', position: { x: 545, y: 650 } },
      ...addBathLabels('dk-front', [{ x: 490, y: 315 }, { x: 300, y: 430 }]),
      ...addBathLabels('dk-rear', [{ x: 815, y: 315 }, { x: 935, y: 465 }]),
    ],
    furniture: [
      { id: 'dk-f-front-sofa', type: 'sofa', position: { x: 255, y: 265 }, width: 180, depth: 90, rotation: 0 },
      { id: 'dk-f-rear-sofa', type: 'sofa', position: { x: 690, y: 265 }, width: 180, depth: 90, rotation: 0 },
      { id: 'dk-f-court-table', type: 'table', position: { x: 545, y: 650 }, width: 150, depth: 90, rotation: 0 },
    ],
    fixtures: skylightFixtures('dk', [{ x: 545, y: 650 }, { x: 255, y: 260 }, { x: 685, y: 260 }]),
    mepSymbols: serviceMep('dk', { x: 500, y: 700 }),
    landscapeElements: placeLandscapeRing({ x: 545, y: 650 }),
    dimensions: [{ id: 'dk-dim-main', start: { x: 120, y: 120 }, end: { x: 1020, y: 120 }, offset: 44 }],
    floorMaterial: 'material-tile',
    northOrientation: 90,
  });
}
