import type { RoomType } from '@/domain/rooms/roomType';

export interface AdjacencyRule {
  roomA: RoomType;
  roomB: RoomType;
  weight: number;
  avoid?: boolean;
}

export const DEFAULT_ADJACENCY_RULES: AdjacencyRule[] = [
  { roomA: 'Kitchen', roomB: 'Dining', weight: 10 },
  { roomA: 'Laundry', roomB: 'Garage', weight: 9 },
  { roomA: 'Garage', roomB: 'Mudroom', weight: 8 },
  { roomA: 'Bathroom', roomB: 'Bedroom', weight: 8 },
  { roomA: 'Bathroom', roomB: 'MasterBedroom', weight: 8 },
  { roomA: 'Ensuite', roomB: 'MasterBedroom', weight: 10 },
  { roomA: 'Entry', roomB: 'Living', weight: 7 },
  { roomA: 'Hallway', roomB: 'Living', weight: 6 },
  { roomA: 'Living', roomB: 'Dining', weight: 8 },
  { roomA: 'MasterBedroom', roomB: 'Living', weight: -10, avoid: true },
];
