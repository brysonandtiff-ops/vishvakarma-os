import type { RoomType } from './roomType';

export const ROOM_TYPE_FILL_COLORS: Partial<Record<RoomType, string>> = {
  Living: '#c4a574',
  Dining: '#b89a68',
  Kitchen: '#8b7355',
  MasterBedroom: '#9a8468',
  Bedroom: '#a89070',
  Bathroom: '#7a8a9a',
  Ensuite: '#8a9aaa',
  Garage: '#6b6b6b',
  Study: '#8b7d6b',
  Entry: '#a89880',
};

const DEFAULT_ROOM_FILL = '#b8941f';

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getRoomTypeFloorColor(roomType?: string, fallback = DEFAULT_ROOM_FILL): string {
  if (roomType && ROOM_TYPE_FILL_COLORS[roomType as RoomType]) {
    return ROOM_TYPE_FILL_COLORS[roomType as RoomType]!;
  }
  return fallback;
}

export function getRoomTypeFillStyle(roomType?: string, alpha = 0.15): string {
  return hexToRgba(getRoomTypeFloorColor(roomType), alpha);
}
