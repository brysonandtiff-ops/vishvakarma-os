import type { Label, ProjectManifest, Wall } from '@/types';

export interface ThermalRoomScore {
  roomName: string;
  comfortScore: number;
  rValue: number;
}

export interface ThermalAnalysisResult {
  overallComfort: number;
  rooms: ThermalRoomScore[];
}

const MATERIAL_R: Record<string, number> = {
  'material-concrete': 2.1,
  'material-brick': 2.8,
  'material-wood': 3.5,
  'material-paint': 1.2,
};

function avgRValue(walls: Wall[]): number {
  if (walls.length === 0) return 2;
  const sum = walls.reduce((s, w) => s + (MATERIAL_R[w.material] ?? 2), 0);
  return sum / walls.length;
}

export function analyzeThermal(
  manifest: Pick<ProjectManifest, 'walls' | 'labels' | 'lighting'>,
): ThermalAnalysisResult {
  const r = avgRValue(manifest.walls);
  const labels = manifest.labels ?? [];
  const sunBoost = manifest.lighting.sunElevation > 35 ? 8 : 0;

  const rooms: ThermalRoomScore[] =
    labels.length > 0
      ? labels.map((l) => ({
          roomName: l.text,
          rValue: r,
          comfortScore: Math.min(100, Math.round(62 + r * 8 + sunBoost)),
        }))
      : [{ roomName: 'Whole plan', rValue: r, comfortScore: Math.min(100, Math.round(58 + r * 10 + sunBoost)) }];

  const overallComfort = Math.round(
    rooms.reduce((s, room) => s + room.comfortScore, 0) / rooms.length,
  );

  return { overallComfort, rooms };
}
