import { createProjectManifest } from '@/core/projectModel';
import type { ProjectManifest } from '@/types';

function rectWalls(x: number, y: number, w: number, h: number, thickness = 200) {
  return [
    { id: 'w-n', start: { x, y }, end: { x: x + w, y }, thickness, height: 2800, material: 'material-concrete' },
    { id: 'w-e', start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness, height: 2800, material: 'material-concrete' },
    { id: 'w-s', start: { x: x + w, y: y + h }, end: { x, y: y + h }, thickness, height: 2800, material: 'material-concrete' },
    { id: 'w-w', start: { x, y: y + h }, end: { x, y }, thickness, height: 2800, material: 'material-concrete' },
  ];
}

export const TEMPLATE_IDS = ['studio', '2bhk', '3bhk'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function getFloorTemplate(id: TemplateId): ProjectManifest {
  if (id === 'studio') {
    return {
      ...createProjectManifest({
        name: 'Studio Apartment',
        walls: rectWalls(80, 80, 320, 240),
        openings: [
          { id: 'd1', type: 'door', wallId: 'w-s', position: 0.5, width: 900, height: 2100 },
          { id: 'win1', type: 'window', wallId: 'w-e', position: 0.4, width: 1200, height: 1200, sillHeight: 900 },
        ],
      }),
      labels: [
        { id: 'l1', text: 'Living', position: { x: 200, y: 160 } },
        { id: 'l2', text: 'Kitchen', position: { x: 280, y: 220 } },
      ],
    };
  }

  if (id === '2bhk') {
    return {
      ...createProjectManifest({
        name: '2BHK Apartment',
        walls: [
          ...rectWalls(60, 60, 420, 300),
          { id: 'w-mid', start: { x: 270, y: 60 }, end: { x: 270, y: 220 }, thickness: 200, height: 2800, material: 'material-concrete' },
        ],
        openings: [
          { id: 'd1', type: 'door', wallId: 'w-s', position: 0.35, width: 900, height: 2100 },
          { id: 'd2', type: 'door', wallId: 'w-mid', position: 0.6, width: 800, height: 2100 },
          { id: 'win1', type: 'window', wallId: 'w-e', position: 0.3, width: 1200, height: 1200, sillHeight: 900 },
          { id: 'win2', type: 'window', wallId: 'w-e', position: 0.75, width: 1200, height: 1200, sillHeight: 900 },
        ],
      }),
      labels: [
        { id: 'l1', text: 'Living', position: { x: 160, y: 180 } },
        { id: 'l2', text: 'Bedroom 1', position: { x: 340, y: 140 } },
        { id: 'l3', text: 'Bedroom 2', position: { x: 340, y: 280 } },
        { id: 'l4', text: 'Kitchen', position: { x: 120, y: 280 } },
      ],
      furniture: [
        { id: 'f1', type: 'sofa', position: { x: 150, y: 200 } },
        { id: 'f2', type: 'bed', position: { x: 350, y: 150 } },
      ],
    };
  }

  return {
    ...createProjectManifest({
      name: '3BHK Apartment',
      walls: [
        ...rectWalls(40, 40, 520, 360),
        { id: 'w-v1', start: { x: 300, y: 40 }, end: { x: 300, y: 260 }, thickness: 200, height: 2800, material: 'material-concrete' },
        { id: 'w-v2', start: { x: 420, y: 40 }, end: { x: 420, y: 260 }, thickness: 200, height: 2800, material: 'material-concrete' },
        { id: 'w-h1', start: { x: 40, y: 260 }, end: { x: 560, y: 260 }, thickness: 200, height: 2800, material: 'material-concrete' },
      ],
      openings: [
        { id: 'd1', type: 'door', wallId: 'w-s', position: 0.25, width: 900, height: 2100 },
        { id: 'd2', type: 'door', wallId: 'w-v1', position: 0.5, width: 800, height: 2100 },
        { id: 'd3', type: 'door', wallId: 'w-v2', position: 0.5, width: 800, height: 2100 },
        { id: 'win1', type: 'window', wallId: 'w-e', position: 0.2, width: 1200, height: 1200, sillHeight: 900 },
        { id: 'win2', type: 'window', wallId: 'w-e', position: 0.55, width: 1200, height: 1200, sillHeight: 900 },
        { id: 'win3', type: 'window', wallId: 'w-e', position: 0.85, width: 1200, height: 1200, sillHeight: 900 },
      ],
    }),
    labels: [
      { id: 'l1', text: 'Living', position: { x: 170, y: 150 } },
      { id: 'l2', text: 'Dining', position: { x: 170, y: 300 } },
      { id: 'l3', text: 'Master Bedroom', position: { x: 480, y: 130 } },
      { id: 'l4', text: 'Bedroom 2', position: { x: 360, y: 130 } },
      { id: 'l5', text: 'Bedroom 3', position: { x: 360, y: 300 } },
      { id: 'l6', text: 'Kitchen', position: { x: 100, y: 300 } },
    ],
    furniture: [
      { id: 'f1', type: 'sofa', position: { x: 160, y: 160 } },
      { id: 'f2', type: 'bed', position: { x: 480, y: 120 } },
      { id: 'f3', type: 'bed', position: { x: 360, y: 120 } },
    ],
  };
}
