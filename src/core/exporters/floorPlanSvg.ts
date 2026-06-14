import type { Opening, ProjectManifest, Wall } from '@/types';
import { getVerticesForRoom } from '@/utils/roomCalculations';

export interface FloorPlanSvgOptions {
  includeRooms?: boolean;
  includeFurniture?: boolean;
  includeDimensions?: boolean;
  includeLabels?: boolean;
  includeMep?: boolean;
  includeLandscape?: boolean;
  includeCompass?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWallLines(walls: Wall[]): string {
  return walls
    .map(
      (w) =>
        `<line class="wall" x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#2c1810" stroke-width="${Math.max(w.thickness, 4)}" stroke-linecap="square" />`,
    )
    .join('');
}

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

      return `<circle class="${opening.type}" cx="${cx}" cy="${cy}" r="6" fill="${opening.type === 'door' ? '#C85A54' : '#D4A13D'}" />`;
    })
    .join('');
}

export function buildFloorPlanSvg(
  manifest: ProjectManifest,
  options: FloorPlanSvgOptions = {},
): string {
  const opts: FloorPlanSvgOptions = {
    includeRooms: true,
    includeFurniture: true,
    includeDimensions: manifest.dimensionVisibility !== false,
    includeLabels: true,
    includeMep: true,
    includeLandscape: true,
    includeCompass: true,
    ...options,
  };

  const walls = buildWallLines(manifest.walls);
  const openings = buildOpeningMarkers(manifest.walls, manifest.openings ?? []);

  const rooms = opts.includeRooms
    ? (manifest.rooms ?? [])
        .map((room) => {
          const vertices = getVerticesForRoom(room, manifest.walls);
          if (vertices.length < 3) return '';
          const points = vertices.map((v) => `${v.x},${v.y}`).join(' ');
          return `<polygon class="room" points="${points}" fill="rgba(180,140,60,0.15)" stroke="rgba(180,140,60,0.45)" stroke-width="1.5" />`;
        })
        .join('')
    : '';

  const labels = opts.includeLabels
    ? (manifest.labels ?? [])
        .map(
          (l) =>
            `<text x="${l.position.x}" y="${l.position.y}" fill="${l.color ?? '#2c1810'}" font-size="${l.fontSize ?? 14}" font-family="sans-serif">${escapeXml(l.text)}</text>`,
        )
        .join('')
    : '';

  const dimensions =
    opts.includeDimensions
      ? (manifest.dimensions ?? [])
          .map((d) => {
            const length = Math.hypot(d.end.x - d.start.x, d.end.y - d.start.y);
            const midX = (d.start.x + d.end.x) / 2;
            const midY = (d.start.y + d.end.y) / 2;
            return `<line x1="${d.start.x}" y1="${d.start.y}" x2="${d.end.x}" y2="${d.end.y}" stroke="#B8941F" stroke-width="2" /><text x="${midX}" y="${midY - 6}" fill="#2c1810" font-size="11" text-anchor="middle">${Math.round(length)}px</text>`;
          })
          .join('')
      : '';

  const furniture = opts.includeFurniture
    ? (manifest.furniture ?? [])
        .map(
          (item) =>
            `<rect class="furniture" x="${item.position.x - 20}" y="${item.position.y - 20}" width="40" height="40" fill="#6b4f3a" opacity="0.5" />`,
        )
        .join('')
    : '';

  const mep = opts.includeMep
    ? (manifest.mepSymbols ?? [])
        .map(
          (symbol) =>
            `<rect class="mep" x="${symbol.position.x - 8}" y="${symbol.position.y - 8}" width="16" height="16" fill="#B8941F" />`,
        )
        .join('')
    : '';

  const landscape = opts.includeLandscape
    ? (manifest.landscapeElements ?? [])
        .map(
          (el) =>
            `<circle class="landscape" cx="${el.position.x}" cy="${el.position.y}" r="12" fill="#388e3c" opacity="0.45" />`,
        )
        .join('')
    : '';

  const compass =
    opts.includeCompass && (manifest.northOrientation ?? 0) !== 0
      ? `<g class="compass" transform="translate(1128,72) rotate(${manifest.northOrientation ?? 0})"><circle r="36" fill="rgba(180,140,60,0.08)" stroke="rgba(180,140,60,0.8)" /><text y="-20" text-anchor="middle" font-size="11" fill="#6b4f2a">N</text></g>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="100%" height="100%" fill="#f5f1e8"/>${walls}${rooms}${openings}${furniture}${mep}${landscape}${dimensions}${labels}${compass}</svg>`;
}
