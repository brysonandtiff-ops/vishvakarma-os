import type { RoomType } from '@/domain/rooms/roomType';

export interface ConceptRoomProgramRow {
  id: string;
  label: string;
  type: RoomType;
  areaSqM: number;
}

export interface ConceptDesign {
  styleSummary: string;
  designIntent: string;
  roomProgram: ConceptRoomProgramRow[];
  adjacencyNotes: string[];
  massingNotes: string;
}
