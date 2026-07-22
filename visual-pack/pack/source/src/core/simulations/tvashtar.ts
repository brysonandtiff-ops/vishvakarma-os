import type { Point2D, Wall } from '@/types';

export interface GridCell {
  x: number;
  y: number;
  blocked: boolean;
}

export interface MepRouteResult {
  path: Point2D[];
  cost: number;
  success: boolean;
}

function wallBlocksPoint(walls: Wall[], p: Point2D, cell = 24): boolean {
  for (const w of walls) {
    const minX = Math.min(w.start.x, w.end.x) - cell;
    const maxX = Math.max(w.start.x, w.end.x) + cell;
    const minY = Math.min(w.start.y, w.end.y) - cell;
    const maxY = Math.max(w.start.y, w.end.y) + cell;
    if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;
  }
  return false;
}

function heuristic(a: Point2D, b: Point2D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function routeMep(
  walls: Wall[],
  start: Point2D,
  end: Point2D,
  gridStep = 40,
): MepRouteResult {
  const key = (p: Point2D) => `${Math.round(p.x / gridStep)},${Math.round(p.y / gridStep)}`;
  const snap = (p: Point2D): Point2D => ({
    x: Math.round(p.x / gridStep) * gridStep,
    y: Math.round(p.y / gridStep) * gridStep,
  });

  const s = snap(start);
  const e = snap(end);
  const open = new Map<string, Point2D>();
  const cameFrom = new Map<string, string>();
  const g = new Map<string, number>();
  const sk = key(s);
  open.set(sk, s);
  g.set(sk, 0);

  const neighbors = (p: Point2D): Point2D[] => [
    { x: p.x + gridStep, y: p.y },
    { x: p.x - gridStep, y: p.y },
    { x: p.x, y: p.y + gridStep },
    { x: p.x, y: p.y - gridStep },
  ];

  let currentKey = sk;
  let safety = 0;

  while (open.size > 0 && safety < 800) {
    safety += 1;
    let best: string | null = null;
    let bestF = Infinity;
    for (const [k, p] of open) {
      const f = (g.get(k) ?? Infinity) + heuristic(p, e);
      if (f < bestF) {
        bestF = f;
        best = k;
      }
    }
    if (!best) break;
    currentKey = best;
    const current = open.get(best)!;
    open.delete(best);

    if (heuristic(current, e) < gridStep) {
      const path: Point2D[] = [e];
      let ck: string | undefined = best;
      while (ck) {
        const node = cameFrom.has(ck)
          ? [...open.values()].find((p) => key(p) === ck)
          : undefined;
        const fromKey = cameFrom.get(ck);
        const pt =
          g.has(ck) && ck === sk
            ? s
            : [...g.keys()]
                .map((k) => ({ k, ...({} as Point2D) }))
                .find(() => false);
        void node;
        void pt;
        path.unshift(
          ck === sk ? s : { x: Number(ck.split(',')[0]) * gridStep, y: Number(ck.split(',')[1]) * gridStep },
        );
        ck = fromKey;
        if (path.length > 40) break;
      }
      path.unshift(s);
      path.push(e);
      return { path: [s, e], cost: g.get(best) ?? heuristic(s, e), success: true };
    }

    for (const n of neighbors(current)) {
      if (wallBlocksPoint(walls, n)) continue;
      const nk = key(n);
      const tg = (g.get(currentKey) ?? 0) + gridStep;
      if (tg < (g.get(nk) ?? Infinity)) {
        cameFrom.set(nk, currentKey);
        g.set(nk, tg);
        open.set(nk, n);
      }
    }
  }

  return { path: [s, e], cost: heuristic(s, e), success: false };
}
