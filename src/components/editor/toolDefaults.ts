import type { ToolType } from '@/types';

export interface ToolDefaultField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'select';
  options?: string[];
}

export interface ToolDefaultsConfig {
  sectionTitle: string;
  fields: ToolDefaultField[];
  footnote: string;
}

const DOOR_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Door defaults',
  footnote: 'Pre-flight defaults – adjust before placing.',
  fields: [
    { id: 'width', label: 'Width', value: '1.0 m', type: 'text' },
    { id: 'swing', label: 'Swing', value: 'Left', type: 'select', options: ['Left', 'Right'] },
  ],
};

const WINDOW_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Window defaults',
  footnote: 'Pre-flight defaults – adjust before placing.',
  fields: [
    { id: 'width', label: 'Width', value: '1.2 m', type: 'text' },
    { id: 'sill', label: 'Sill height', value: '0.9 m', type: 'text' },
  ],
};

const WALL_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Wall defaults',
  footnote: 'Tap start point, then end point on canvas.',
  fields: [
    { id: 'thickness', label: 'Thickness', value: '0.2 m', type: 'text' },
    { id: 'height', label: 'Height', value: '2.8 m', type: 'text' },
  ],
};

const SELECT_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Selection',
  footnote: 'Select a wall or opening to edit properties.',
  fields: [],
};

const MEASURE_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Measure tool',
  footnote: 'Tap walls or openings to inspect dimensions.',
  fields: [],
};

const TERRAIN_DEFAULTS: ToolDefaultsConfig = {
  sectionTitle: 'Terrain defaults',
  footnote: 'Tap vertices to draw a contour. Click the first point to close. Elevation cycles per patch.',
  fields: [
    { id: 'elevation', label: 'Next elevation', value: 'Grade (0 cm)', type: 'text' },
  ],
};

export function getToolDefaults(tool: ToolType): ToolDefaultsConfig {
  switch (tool) {
    case 'door':
      return DOOR_DEFAULTS;
    case 'window':
      return WINDOW_DEFAULTS;
    case 'wall':
      return WALL_DEFAULTS;
    case 'terrain':
      return TERRAIN_DEFAULTS;
    case 'measure':
    case 'dimension':
      return MEASURE_DEFAULTS;
    default:
      return SELECT_DEFAULTS;
  }
}
