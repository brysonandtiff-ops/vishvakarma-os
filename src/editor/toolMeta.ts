import {
  Columns3,
  Compass,
  DoorOpen,
  Hand,
  Layers,
  MousePointer2,
  MoveHorizontal,
  PenLine,
  Ruler,
  Sofa,
  Square,
  SquareDashed,
  SquareStack,
  TreePine,
  Type,
  Zap,
} from 'lucide-react';
import type { ToolType } from '@/types';

export type ToolMetaEntry = {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint: string;
};

export const TOOL_META: Record<ToolType, ToolMetaEntry> = {
  select: {
    icon: MousePointer2,
    label: 'Select',
    shortcut: 'V',
    hint: 'Select, marquee, and inspect elements',
  },
  pan: {
    icon: Hand,
    label: 'Pan',
    shortcut: 'H',
    hint: 'Drag to move canvas',
  },
  wall: {
    icon: Square,
    label: 'Wall',
    shortcut: 'W',
    hint: 'Tap start, tap end',
  },
  door: {
    icon: DoorOpen,
    label: 'Door',
    shortcut: 'D',
    hint: 'Tap a wall to place',
  },
  window: {
    icon: SquareDashed,
    label: 'Window',
    shortcut: 'N',
    hint: 'Tap a wall to place',
  },
  measure: {
    icon: Ruler,
    label: 'Measure',
    shortcut: 'M',
    hint: 'Inspect dimensions',
  },
  text: {
    icon: Type,
    label: 'Label',
    shortcut: 'T',
    hint: 'Place room label',
  },
  dimension: {
    icon: MoveHorizontal,
    label: 'Dimension',
    shortcut: '⇧M',
    hint: 'Dimension line',
  },
  room: {
    icon: Square,
    label: 'Room',
    hint: 'Detect / label rooms',
  },
  column: {
    icon: Columns3,
    label: 'Column',
    shortcut: 'C',
    hint: 'Place structural column markers',
  },
  stair: {
    icon: SquareStack,
    label: 'Stair',
    shortcut: 'U',
    hint: 'Place staircase runs; tap to rotate direction',
  },
  vastu: {
    icon: Compass,
    label: 'Vastu',
    hint: 'Harmony compass overlay',
  },
  mep: {
    icon: Zap,
    label: 'MEP',
    hint: 'Place MEP symbols and lighting fixtures',
  },
  furniture: {
    icon: Sofa,
    label: 'Furniture',
    shortcut: 'F',
    hint: 'Place furniture',
  },
  landscape: {
    icon: TreePine,
    label: 'Landscape',
    hint: 'Garden elements',
  },
  terrain: {
    icon: Layers,
    label: 'Terrain',
    hint: 'Tap vertices, click first point to close',
  },
};

export const STATUS_TOOL_HINTS: Record<ToolType, string> = {
  select: 'Select — click to inspect, Shift+click multi-select, drag empty to marquee',
  pan: 'Pan — drag to move the canvas view',
  wall: 'Wall — tap start, tap end. Snap joins corners.',
  door: 'Door — tap a wall to place a door.',
  window: 'Window — tap a wall to place a window.',
  measure: 'Measure — hover or tap walls to inspect dimensions.',
  text: 'Label — tap to place a room label.',
  dimension: 'Dimension — tap start point, then end point.',
  room: 'Room — tap enclosed area to detect and label rooms.',
  column: 'Column — tap canvas to place structural column markers.',
  stair: 'Stair — tap to place; each tap cycles run direction.',
  vastu: 'Vastu — harmony compass overlay; adjust north in sidebar.',
  mep: 'MEP — tap canvas to cycle MEP symbols and lighting fixtures.',
  furniture: 'Furniture — tap canvas to place furniture.',
  landscape: 'Landscape — tap canvas to place garden elements.',
  terrain: 'Terrain — tap vertices, click the first point to close the contour.',
};

export const TOUCH_STATUS_HINTS: Record<ToolType, string> = {
  select: 'Select — tap to inspect · pinch to zoom and pan',
  pan: 'Pan — drag with one finger to move the canvas',
  wall: 'Wall — tap start, tap end · pinch to zoom',
  door: 'Door — tap a wall to place · pinch to navigate',
  window: 'Window — tap a wall to place · pinch to navigate',
  measure: 'Measure — tap walls to inspect dimensions',
  text: 'Label — tap to place · double-tap label to edit',
  dimension: 'Dimension — tap start, then end point',
  room: 'Room — tap enclosed area to detect rooms',
  column: 'Column — tap canvas to place markers',
  stair: 'Stair — tap to place; each tap rotates direction',
  vastu: 'Vastu — harmony compass overlay',
  mep: 'MEP — tap to cycle symbols and fixtures',
  furniture: 'Furniture — tap canvas to place',
  landscape: 'Landscape — tap to place garden elements',
  terrain: 'Terrain — tap vertices, tap first point to close',
};

export const BASE_TOOL_IDS: ToolType[] = [
  'select',
  'pan',
  'wall',
  'door',
  'window',
  'measure',
  'text',
  'dimension',
];

export const RADIAL_TOOL_IDS: ToolType[] = [
  'pan',
  'wall',
  'door',
  'window',
  'measure',
  'text',
  'dimension',
  'column',
  'stair',
];

/** @deprecated Use TOOL_META — kept for legacy imports */
export const PenLineWallIcon = PenLine;
