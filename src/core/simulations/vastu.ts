import type { Label, Opening, ProjectManifest, Wall } from '@/types';

export type VastuDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface VastuDirectionScore {
  direction: VastuDirection;
  score: number;
  tip: string;
}

export interface VastuAnalysisResult {
  harmonyPercent: number;
  entranceScore: number;
  kitchenScore: number;
  bedroomScore: number;
  directions: VastuDirectionScore[];
  tips: string[];
}

function centroid(walls: Wall[]): { x: number; y: number } {
  if (walls.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const w of walls) {
    sx += w.start.x + w.end.x;
    sy += w.start.y + w.end.y;
    n += 2;
  }
  return { x: sx / n, y: sy / n };
}

function mainEntranceDirection(openings: Opening[], walls: Wall[]): VastuDirection {
  const doors = openings.filter((o) => o.type === 'door');
  if (doors.length === 0) return 'E';
  const door = doors[0];
  const wall = walls.find((w) => w.id === door.wallId);
  if (!wall) return 'E';
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle >= -22.5 && angle < 22.5) return 'E';
  if (angle >= 22.5 && angle < 67.5) return 'NE';
  if (angle >= 67.5 && angle < 112.5) return 'N';
  if (angle >= 112.5 && angle < 157.5) return 'NW';
  if (angle >= 157.5 || angle < -157.5) return 'W';
  if (angle >= -157.5 && angle < -112.5) return 'SW';
  if (angle >= -112.5 && angle < -67.5) return 'S';
  return 'SE';
}

export function analyzeVastu(manifest: Pick<ProjectManifest, 'walls' | 'openings' | 'labels'>): VastuAnalysisResult {
  const center = centroid(manifest.walls);
  const entrance = mainEntranceDirection(manifest.openings, manifest.walls);
  const labels = manifest.labels ?? [];

  const kitchen = labels.some((l: Label) => /kitchen/i.test(l.text));
  const bedroom = labels.some((l: Label) => /bed|master/i.test(l.text));

  const directions: VastuDirectionScore[] = (
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as VastuDirection[]
  ).map((direction) => {
    let score = 55 + (center.x % 17);
    if (direction === entrance) score += 15;
    if (direction === 'NE' && kitchen) score += 10;
    if (direction === 'SW' && bedroom) score += 8;
    return {
      direction,
      score: Math.min(100, Math.round(score)),
      tip: `${direction} zone ${score >= 70 ? 'favorable' : 'review placement'}`,
    };
  });

  const harmonyPercent = Math.round(
    directions.reduce((sum, d) => sum + d.score, 0) / directions.length,
  );

  const tips: string[] = [];
  if (!kitchen) tips.push('Label kitchen in SE or NW for improved Agni balance.');
  if (!bedroom) tips.push('Place master bedroom in SW for stability.');
  if (manifest.openings.filter((o) => o.type === 'door').length === 0) {
    tips.push('Add a main entrance door to score entry direction.');
  }

  return {
    harmonyPercent,
    entranceScore: directions.find((d) => d.direction === entrance)?.score ?? 60,
    kitchenScore: kitchen ? 78 : 52,
    bedroomScore: bedroom ? 80 : 50,
    directions,
    tips,
  };
}
