export const ROOM_TYPES = [
  'Living',
  'Dining',
  'Kitchen',
  'MasterBedroom',
  'Bedroom',
  'Bathroom',
  'Ensuite',
  'Garage',
  'Laundry',
  'Mudroom',
  'Hallway',
  'Entry',
  'Study',
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export const MIN_ROOM_SIZE_M: Record<RoomType, { width: number; depth: number }> = {
  Living: { width: 4.5, depth: 4 },
  Dining: { width: 3, depth: 3 },
  Kitchen: { width: 3, depth: 2.8 },
  MasterBedroom: { width: 4, depth: 3.5 },
  Bedroom: { width: 3.2, depth: 3 },
  Bathroom: { width: 2.2, depth: 2.2 },
  Ensuite: { width: 2.5, depth: 2 },
  Garage: { width: 3, depth: 6 },
  Laundry: { width: 2, depth: 2 },
  Mudroom: { width: 2, depth: 2 },
  Hallway: { width: 1.4, depth: 3 },
  Entry: { width: 2, depth: 2 },
  Study: { width: 3, depth: 2.8 },
};

export function roomTypeLabel(type: RoomType, index = 0): string {
  if (type === 'Bedroom') return index > 0 ? `Bedroom ${index}` : 'Bedroom';
  if (type === 'Bathroom') return index > 0 ? `Bathroom ${index}` : 'Bathroom';
  return type.replace(/([A-Z])/g, ' $1').trim();
}
