import type { Wall } from '@/types';

/** Camera centred on the real building; positions are in 3D scene metres. */
export interface SceneCameraFrame {
  position: [number, number, number];
  target: [number, number, number];
}

export function calculateSceneCameraFrame(
  walls: ReadonlyArray<Pick<Wall, 'start' | 'end' | 'height'>>,
): SceneCameraFrame {
  if (walls.length === 0) {
    return { position: [7, 5.5, 7], target: [0, 1.2, 0] };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxHeight = 0;
  for (const wall of walls) {
    const values = [wall.start.x, wall.start.y, wall.end.x, wall.end.y, wall.height];
    if (!values.every(Number.isFinite)) continue;
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minY = Math.min(minY, wall.start.y, wall.end.y);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxY = Math.max(maxY, wall.start.y, wall.end.y);
    maxHeight = Math.max(maxHeight, wall.height);
  }
  if (!Number.isFinite(minX)) return { position: [7, 5.5, 7], target: [0, 1.2, 0] };

  const span = Math.max((maxX - minX) / 100, (maxY - minY) / 100, 1);
  const wallHeight = Math.max(1, maxHeight / 100);
  const distance = Math.max(6, Math.min(70, 3.5 + span * 1.5 + wallHeight * 0.4));
  const focusY = Math.max(0.8, Math.min(2.4, wallHeight / 2));

  return {
    position: [distance * 0.78, focusY + distance * 0.64, distance * 0.78],
    target: [0, focusY, 0],
  };
}
