import type { Opening, ProjectManifest, Wall } from '@/types';

function buildOpeningMarkers(walls: Wall[], openings: Opening[]): string {
  return openings
    .map((opening) => {
      const wall = walls.find((w) => w.id === opening.wallId);
      if (!wall) return '';

      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.hypot(dx, dy);
      if (length === 0) return '';

      const cx = wall.start.x + dx * opening.position;
      const cy = wall.start.y + dy * opening.position;
      const nx = -dy / length;
      const ny = dx / length;
      const half = opening.width / 2;
      const color = opening.type === 'door' ? '#C85A54' : '#D4A13D';

      return `<line x1="${cx - nx * half}" y1="${cy - ny * half}" x2="${cx + nx * half}" y2="${cy + ny * half}" stroke="${color}" stroke-width="4" stroke-linecap="round" />`;
    })
    .join('');
}

export function buildFloorPlanSvg(manifest: ProjectManifest): string {
  const walls = manifest.walls
    .map(
      (w) =>
        `<line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#2c1810" stroke-width="${Math.max(w.thickness, 4)}" stroke-linecap="square" />`,
    )
    .join('');

  const openings = buildOpeningMarkers(manifest.walls, manifest.openings ?? []);

  const labels = (manifest.labels ?? [])
    .map(
      (l) =>
        `<text x="${l.position.x}" y="${l.position.y}" fill="${l.color ?? '#2c1810'}" font-size="${l.fontSize ?? 14}" font-family="sans-serif">${l.text}</text>`,
    )
    .join('');

  const showDimensions = manifest.dimensionVisibility !== false;
  const dimensions = showDimensions
    ? (manifest.dimensions ?? [])
        .map((d) => {
          const length = Math.hypot(d.end.x - d.start.x, d.end.y - d.start.y);
          const midX = (d.start.x + d.end.x) / 2;
          const midY = (d.start.y + d.end.y) / 2;
          return `<line x1="${d.start.x}" y1="${d.start.y}" x2="${d.end.x}" y2="${d.end.y}" stroke="#B8941F" stroke-width="2" /><text x="${midX}" y="${midY - 6}" fill="#2c1810" font-size="11" text-anchor="middle">${Math.round(length)}px</text>`;
        })
        .join('')
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="100%" height="100%" fill="#f5f1e8"/>${walls}${openings}${dimensions}${labels}</svg>`;
}
