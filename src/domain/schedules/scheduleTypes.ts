import type { RoomType } from '@/domain/rooms/roomType';

export interface RoomScheduleRow {
  id: string;
  name: string;
  type: RoomType;
  areaSqM: number;
  floor: number;
}

export interface WallScheduleRow {
  id: string;
  lengthM: number;
  heightM: number;
  material: string;
  floor: number;
}

export interface WindowScheduleRow {
  id: string;
  wallId: string;
  widthM: number;
  heightM: number;
  sillHeightM: number;
  roomLabel?: string;
}
