import type { Opening, Point2D, Wall } from '@/types';
import {
  CANVAS_FONT_MONO,
  CANVAS_FONT_MONO_SM,
  CANVAS_FONT_MONO_XS,
  CHIP_FILL_ALPHA,
  CHIP_STROKE,
  DOOR,
  DOOR_GHOST,
  GOLD,
  GOLD_BRIGHT,
  GOLD_HOVER,
  GOLD_PREVIEW,
  INK,
  WALL_SHADOW,
  WINDOW,
  WINDOW_GHOST,
} from '@/core/sceneDrawingTokens';
import { formatDimensionBySystem, type UnitSystem } from '@/utils/measurements';

export interface OpeningSpan {
  center: Point2D;
  wallAngle: number;
  halfWidthPx: number;
  startT: number;
  endT: number;
}

export interface WallDrawState {
  selected: boolean;
  hovered: boolean;
  snapEnabled: boolean;
}

function wallLength(wall: Wall): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function wallPoint(wall: Wall, t: number): Point2D {
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    y: wall.start.y + (wall.end.y - wall.start.y) * t,
  };
}

export function openingSpanOnWall(wall: Wall, opening: Opening): OpeningSpan | null {
  const length = wallLength(wall);
  if (length === 0) return null;

  const halfWidthParam = opening.width / length / 2;
  const startT = Math.max(0, opening.position - halfWidthParam);
  const endT = Math.min(1, opening.position + halfWidthParam);
  const center = wallPoint(wall, opening.position);
  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  return {
    center,
    wallAngle,
    halfWidthPx: opening.width / 2,
    startT,
    endT,
  };
}

export function openingGapParams(opening: Opening, wallLen: number): { start: number; end: number } {
  const halfParam = opening.width / wallLen / 2;
  return {
    start: Math.max(0, opening.position - halfParam),
    end: Math.min(1, opening.position + halfParam),
  };
}

function mergeGapSegments(gaps: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (gaps.length === 0) return [];
  const sorted = [...gaps].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end + 0.001) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function wallStrokeSegments(
  wall: Wall,
  openingsOnWall: Opening[],
): Array<{ start: number; end: number }> {
  const length = wallLength(wall);
  if (length === 0) return [];

  const gaps = mergeGapSegments(openingsOnWall.map((o) => openingGapParams(o, length)));
  const segments: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.start > cursor + 0.001) {
      segments.push({ start: cursor, end: gap.start });
    }
    cursor = Math.max(cursor, gap.end);
  }
  if (cursor < 1 - 0.001) {
    segments.push({ start: cursor, end: 1 });
  }
  return segments;
}

function drawWallSegmentStrokes(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  segments: Array<{ start: number; end: number }>,
  strokeStyle: string,
  lineWidth: number,
  offset = 0,
) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';
  for (const segment of segments) {
    const start = wallPoint(wall, segment.start);
    const end = wallPoint(wall, segment.end);
    ctx.beginPath();
    ctx.moveTo(start.x + offset, start.y + offset);
    ctx.lineTo(end.x + offset, end.y + offset);
    ctx.stroke();
  }
}

export function drawWallWithGaps(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  openingsOnWall: Opening[],
  state: WallDrawState,
) {
  const segments = wallStrokeSegments(wall, openingsOnWall);
  const inkSegments = segments.length ? segments : openingsOnWall.length === 0 ? [{ start: 0, end: 1 }] : [];

  if (inkSegments.length > 0) {
    drawWallSegmentStrokes(ctx, wall, inkSegments, WALL_SHADOW, wall.thickness + 2, 1.5);
  }

  if (state.hovered && !state.selected && inkSegments.length > 0) {
    drawWallSegmentStrokes(ctx, wall, inkSegments, GOLD_HOVER, wall.thickness + 5);
  }

  if (inkSegments.length > 0) {
    drawWallSegmentStrokes(ctx, wall, inkSegments, state.selected ? GOLD : INK, wall.thickness);
  }

  ctx.fillStyle = state.selected ? GOLD : INK;
  for (const point of [wall.start, wall.end]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, wall.thickness / 2 + (state.selected ? 0.5 : 0), 0, Math.PI * 2);
    ctx.fill();

    if (state.snapEnabled) {
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawJambTicks(
  ctx: CanvasRenderingContext2D,
  span: OpeningSpan,
  color: string,
  tickLen = 6,
) {
  const perpX = Math.sin(span.wallAngle);
  const perpY = -Math.cos(span.wallAngle);
  const cos = Math.cos(span.wallAngle);
  const sin = Math.sin(span.wallAngle);
  const halfW = span.halfWidthPx;

  const jambA = {
    x: span.center.x - cos * halfW,
    y: span.center.y - sin * halfW,
  };
  const jambB = {
    x: span.center.x + cos * halfW,
    y: span.center.y + sin * halfW,
  };

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (const jamb of [jambA, jambB]) {
    ctx.beginPath();
    ctx.moveTo(jamb.x - perpX * tickLen, jamb.y - perpY * tickLen);
    ctx.lineTo(jamb.x + perpX * tickLen, jamb.y + perpY * tickLen);
    ctx.stroke();
  }
}

export function drawDoorSymbol(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
  options: { highlighted?: boolean; preview?: boolean } = {},
) {
  const span = openingSpanOnWall(wall, opening);
  if (!span) return;

  const color = options.preview ? DOOR_GHOST : DOOR;
  const { center, wallAngle, halfWidthPx } = span;
  const hingeLeft = opening.position <= 0.5;
  const cos = Math.cos(wallAngle);
  const sin = Math.sin(wallAngle);
  const perpX = Math.sin(wallAngle);
  const perpY = -Math.cos(wallAngle);

  const hingeX = center.x + (hingeLeft ? -1 : 1) * cos * halfWidthPx;
  const hingeY = center.y + (hingeLeft ? -1 : 1) * sin * halfWidthPx;
  const leafEndX = hingeX + perpX * halfWidthPx * 2 * (hingeLeft ? 1 : -1);
  const leafEndY = hingeY + perpY * halfWidthPx * 2 * (hingeLeft ? 1 : -1);

  ctx.strokeStyle = color;
  ctx.lineWidth = options.highlighted ? 2.5 : 1.75;
  ctx.beginPath();
  ctx.moveTo(hingeX, hingeY);
  ctx.lineTo(leafEndX, leafEndY);
  ctx.stroke();

  ctx.beginPath();
  const arcStart = wallAngle + (hingeLeft ? Math.PI / 2 : -Math.PI / 2);
  const arcEnd = wallAngle + (hingeLeft ? 0 : Math.PI);
  ctx.arc(hingeX, hingeY, halfWidthPx * 2, arcStart, arcEnd, !hingeLeft);
  ctx.stroke();

  drawJambTicks(ctx, span, color);

  if (options.highlighted) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawWindowSymbol(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
  options: { highlighted?: boolean; preview?: boolean } = {},
) {
  const span = openingSpanOnWall(wall, opening);
  if (!span) return;

  const color = options.preview ? WINDOW_GHOST : WINDOW;
  const { center, wallAngle, halfWidthPx } = span;
  const cos = Math.cos(wallAngle);
  const sin = Math.sin(wallAngle);
  const perpX = Math.sin(wallAngle);
  const perpY = -Math.cos(wallAngle);
  const gap = 3;

  const lineA = {
    x1: center.x - cos * halfWidthPx + perpX * gap,
    y1: center.y - sin * halfWidthPx + perpY * gap,
    x2: center.x + cos * halfWidthPx + perpX * gap,
    y2: center.y + sin * halfWidthPx + perpY * gap,
  };
  const lineB = {
    x1: center.x - cos * halfWidthPx - perpX * gap,
    y1: center.y - sin * halfWidthPx - perpY * gap,
    x2: center.x + cos * halfWidthPx - perpX * gap,
    y2: center.y + sin * halfWidthPx - perpY * gap,
  };

  ctx.strokeStyle = color;
  ctx.lineWidth = options.highlighted ? 2.5 : 1.75;
  for (const line of [lineA, lineB]) {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }

  const sillMid = {
    x: center.x + perpX * (gap + 4),
    y: center.y + perpY * (gap + 4),
  };
  ctx.beginPath();
  ctx.moveTo(sillMid.x - cos * halfWidthPx * 0.6, sillMid.y - sin * halfWidthPx * 0.6);
  ctx.lineTo(sillMid.x + cos * halfWidthPx * 0.6, sillMid.y + sin * halfWidthPx * 0.6);
  ctx.stroke();

  drawJambTicks(ctx, span, color, 5);

  if (options.highlighted) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawOpeningHoverChip(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
  options: {
    unitSystem: UnitSystem;
    dragging?: boolean;
    dragPositionPercent?: number;
    showDetails?: boolean;
  },
) {
  const position = options.dragging && options.dragPositionPercent !== undefined
    ? options.dragPositionPercent
    : opening.position;
  const x = wall.start.x + (wall.end.x - wall.start.x) * position;
  const y = wall.start.y + (wall.end.y - wall.start.y) * position;
  const color = opening.type === 'door' ? DOOR : WINDOW;
  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  if (options.dragging && options.dragPositionPercent !== undefined) {
    ctx.fillStyle = CHIP_FILL_ALPHA;
    ctx.fillRect(x - 28, y - 36, 56, 20);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 28, y - 36, 56, 20);
    ctx.fillStyle = INK;
    ctx.font = CANVAS_FONT_MONO_SM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(position * 100)}%`, x, y - 26);
  }

  if (!options.showDetails) return;

  const labelX = x + Math.sin(wallAngle) * 40;
  const labelY = y - Math.cos(wallAngle) * 40;

  ctx.fillStyle = CHIP_FILL_ALPHA;
  ctx.fillRect(labelX - 45, labelY - 22, 90, 44);
  ctx.strokeStyle = color;
  ctx.strokeRect(labelX - 45, labelY - 22, 90, 44);
  ctx.fillStyle = INK;
  ctx.font = CANVAS_FONT_MONO_SM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opening.type.toUpperCase(), labelX, labelY - 10);
  ctx.font = CANVAS_FONT_MONO_XS;
  ctx.fillText(`W: ${formatDimensionBySystem(opening.width * 2, options.unitSystem, 0)}`, labelX, labelY + 2);
  ctx.fillText(`H: ${formatDimensionBySystem(opening.height * 2, options.unitSystem, 0)}`, labelX, labelY + 12);
}

export function drawOpeningDragHandles(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
) {
  const span = openingSpanOnWall(wall, opening);
  if (!span) return;

  const { center, wallAngle } = span;
  const handleOffset = 18;
  for (const sign of [-1, 1]) {
    const hx = center.x + Math.cos(wallAngle) * handleOffset * sign;
    const hy = center.y + Math.sin(wallAngle) * handleOffset * sign;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CHIP_STROKE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function buildOpeningSvgMarkup(wall: Wall, opening: Opening): string {
  const span = openingSpanOnWall(wall, opening);
  if (!span) return '';

  const color = opening.type === 'door' ? DOOR : WINDOW;
  if (opening.type === 'door') {
    const hingeLeft = opening.position <= 0.5;
    const { center, wallAngle, halfWidthPx } = span;
    const cos = Math.cos(wallAngle);
    const sin = Math.sin(wallAngle);
    const perpX = Math.sin(wallAngle);
    const perpY = -Math.cos(wallAngle);
    const hingeX = center.x + (hingeLeft ? -1 : 1) * cos * halfWidthPx;
    const hingeY = center.y + (hingeLeft ? -1 : 1) * sin * halfWidthPx;
    const leafEndX = hingeX + perpX * halfWidthPx * 2 * (hingeLeft ? 1 : -1);
    const leafEndY = hingeY + perpY * halfWidthPx * 2 * (hingeLeft ? 1 : -1);
    const arcStart = wallAngle + (hingeLeft ? Math.PI / 2 : -Math.PI / 2);
    const arcEnd = wallAngle + (hingeLeft ? 0 : Math.PI);
    const largeArc = 0;
    const sweep = hingeLeft ? 0 : 1;
    const arcPath = `M ${hingeX + Math.cos(arcStart) * halfWidthPx * 2} ${hingeY + Math.sin(arcStart) * halfWidthPx * 2} A ${halfWidthPx * 2} ${halfWidthPx * 2} 0 ${largeArc} ${sweep} ${hingeX + Math.cos(arcEnd) * halfWidthPx * 2} ${hingeY + Math.sin(arcEnd) * halfWidthPx * 2}`;
    return `<g class="door"><line x1="${hingeX}" y1="${hingeY}" x2="${leafEndX}" y2="${leafEndY}" stroke="${color}" stroke-width="2" /><path d="${arcPath}" fill="none" stroke="${color}" stroke-width="1.5" /></g>`;
  }

  const { center, wallAngle, halfWidthPx } = span;
  const cos = Math.cos(wallAngle);
  const sin = Math.sin(wallAngle);
  const perpX = Math.sin(wallAngle);
  const perpY = -Math.cos(wallAngle);
  const gap = 3;
  return `<g class="window"><line x1="${center.x - cos * halfWidthPx + perpX * gap}" y1="${center.y - sin * halfWidthPx + perpY * gap}" x2="${center.x + cos * halfWidthPx + perpX * gap}" y2="${center.y + sin * halfWidthPx + perpY * gap}" stroke="${color}" stroke-width="2" /><line x1="${center.x - cos * halfWidthPx - perpX * gap}" y1="${center.y - sin * halfWidthPx - perpY * gap}" x2="${center.x + cos * halfWidthPx - perpX * gap}" y2="${center.y + sin * halfWidthPx - perpY * gap}" stroke="${color}" stroke-width="2" /></g>`;
}

export function buildWallSegmentsSvg(wall: Wall, openingsOnWall: Opening[]): string {
  const length = wallLength(wall);
  if (length === 0) return '';

  const segments = wallStrokeSegments(wall, openingsOnWall);
  const strokeWidth = Math.max(wall.thickness, 4);
  const drawSegments = segments.length ? segments : [{ start: 0, end: 1 }];

  return drawSegments
    .map((segment) => {
      const start = wallPoint(wall, segment.start);
      const end = wallPoint(wall, segment.end);
      return `<line class="wall" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#2C2C2C" stroke-width="${strokeWidth}" stroke-linecap="square" />`;
    })
    .join('');
}
