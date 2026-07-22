import type { DimensionAnnotation, Opening, Point2D, Wall } from '@/types';
import {
  CANVAS_FONT_MONO,
  CANVAS_FONT_MONO_SM,
  CANVAS_FONT_MONO_XS,
  CANVAS_PAPER_FILL,
  CHIP_FILL,
  CHIP_FILL_ALPHA,
  CHIP_FILL_PREVIEW,
  CHIP_STROKE,
  DOOR,
  DOOR_GHOST,
  GOLD,
  GOLD_BRIGHT,
  GOLD_HOVER,
  GOLD_PREVIEW,
  GRID_FADE_MARGIN,
  INK,
  PAPER_VIGNETTE,
  WALL_SHADOW,
  WALL_HIGHLIGHT,
  WINDOW,
  WINDOW_GHOST,
  computeVisibleGridBounds,
  gridMajorStroke,
  gridMinorStroke,
  type WorldBounds,
} from '@/core/sceneDrawingTokens';
import { formatDimensionBySystem, type UnitSystem } from '@/utils/measurements';
import {
  drawDoorSymbol,
  drawOpeningDragHandles,
  drawOpeningHoverChip,
  drawWindowSymbol,
} from '@/components/editor/blueprint/openingSymbols';

export { computeVisibleGridBounds, type WorldBounds };

export function drawPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bhumiMode?: string,
) {
  let fillStyle = CANVAS_PAPER_FILL;
  let vignetteColor = PAPER_VIGNETTE;

  if (bhumiMode === 'midnight-obsidian') {
    fillStyle = '#050507';
    vignetteColor = 'rgba(0, 0, 0, 0.4)';
  } else if (bhumiMode === 'industrial-slate') {
    fillStyle = '#2d3748';
    vignetteColor = 'rgba(0, 0, 0, 0.3)';
  } else if (bhumiMode === 'indigo-cyanotype') {
    fillStyle = '#0b2c5c';
    vignetteColor = 'rgba(0, 0, 0, 0.35)';
  } else if (bhumiMode === 'aged-copper') {
    fillStyle = '#1c2d24';
    vignetteColor = 'rgba(0, 0, 0, 0.3)';
  } else if (bhumiMode === 'sacred-parchment') {
    fillStyle = '#f5eedc';
    vignetteColor = 'rgba(44, 28, 16, 0.06)';
  }

  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  gradient.addColorStop(0, 'rgba(253, 249, 245, 0)');
  gradient.addColorStop(1, vignetteColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  bounds: WorldBounds,
  gridSize: number,
  bhumiMode?: string,
) {
  if (bhumiMode) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)'; // Gold at 5% opacity

    const pad = gridSize;
    const startX = Math.floor((bounds.left - pad) / gridSize) * gridSize;
    const endX = bounds.left + bounds.width + pad;
    const startY = Math.floor((bounds.top - pad) / gridSize) * gridSize;
    const endY = bounds.top + bounds.height + pad;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.top - pad);
      ctx.lineTo(x, bounds.top + bounds.height + pad);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(bounds.left - pad, y);
      ctx.lineTo(bounds.left + bounds.width + pad, y);
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  const pattern = createGridPattern(ctx, gridSize);
  if (pattern) {
    ctx.save();
    ctx.fillStyle = pattern;
    ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
    ctx.restore();
    return;
  }

  drawGridLines(ctx, bounds, gridSize);
}

function createGridPattern(ctx: CanvasRenderingContext2D, gridSize: number): CanvasPattern | null {
  if (typeof document === 'undefined') return null;
  const tile = document.createElement('canvas');
  tile.width = gridSize;
  tile.height = gridSize;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return null;
  tileCtx.strokeStyle = gridMinorStroke(0.35);
  tileCtx.lineWidth = 1;
  tileCtx.beginPath();
  tileCtx.moveTo(gridSize, 0);
  tileCtx.lineTo(gridSize, gridSize);
  tileCtx.moveTo(0, gridSize);
  tileCtx.lineTo(gridSize, gridSize);
  tileCtx.stroke();
  return ctx.createPattern(tile, 'repeat');
}

function drawGridLines(ctx: CanvasRenderingContext2D, bounds: WorldBounds, gridSize: number) {
  const fadeMargin = Math.min(bounds.width, bounds.height) * GRID_FADE_MARGIN;
  const edgeFade = (coord: number, min: number, max: number) => {
    const d = Math.min(coord - min, max - coord);
    if (d >= fadeMargin) return 1;
    return Math.max(0.15, d / fadeMargin);
  };

  const pad = gridSize;
  const minX = bounds.left;
  const maxX = bounds.left + bounds.width;
  const minY = bounds.top;
  const maxY = bounds.top + bounds.height;
  const startX = Math.floor((minX - pad) / gridSize) * gridSize;
  const endX = maxX + pad;
  const startY = Math.floor((minY - pad) / gridSize) * gridSize;
  const endY = maxY + pad;
  const majorStep = gridSize * 5;

  ctx.lineWidth = 1;
  for (let x = startX; x <= endX; x += gridSize) {
    const alpha = edgeFade(x, minX, maxX);
    ctx.strokeStyle = gridMinorStroke(alpha);
    ctx.beginPath();
    ctx.moveTo(x, minY - pad);
    ctx.lineTo(x, maxY + pad);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += gridSize) {
    const alpha = edgeFade(y, minY, maxY);
    ctx.strokeStyle = gridMinorStroke(alpha);
    ctx.beginPath();
    ctx.moveTo(minX - pad, y);
    ctx.lineTo(maxX + pad, y);
    ctx.stroke();
  }

  ctx.lineWidth = 2;
  const majorStartX = Math.floor((minX - pad) / majorStep) * majorStep;
  const majorStartY = Math.floor((minY - pad) / majorStep) * majorStep;
  for (let x = majorStartX; x <= endX; x += majorStep) {
    const alpha = edgeFade(x, minX, maxX);
    ctx.strokeStyle = gridMajorStroke(alpha);
    ctx.beginPath();
    ctx.moveTo(x, minY - pad);
    ctx.lineTo(x, maxY + pad);
    ctx.stroke();
  }
  for (let y = majorStartY; y <= endY; y += majorStep) {
    const alpha = edgeFade(y, minY, maxY);
    ctx.strokeStyle = gridMajorStroke(alpha);
    ctx.beginPath();
    ctx.moveTo(minX - pad, y);
    ctx.lineTo(maxX + pad, y);
    ctx.stroke();
  }
}

export function drawWall(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  state: { selected: boolean; hovered: boolean; snapEnabled: boolean },
) {
  const pranaActive = typeof document !== 'undefined' && document.documentElement.dataset.pranaActive === 'true';

  ctx.strokeStyle = WALL_SHADOW;
  ctx.lineWidth = wall.thickness + 2;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(wall.start.x + 1.5, wall.start.y + 1.5);
  ctx.lineTo(wall.end.x + 1.5, wall.end.y + 1.5);
  ctx.stroke();

  ctx.strokeStyle = WALL_HIGHLIGHT;
  ctx.lineWidth = wall.thickness;
  ctx.beginPath();
  ctx.moveTo(wall.start.x - 0.75, wall.start.y - 0.75);
  ctx.lineTo(wall.end.x - 0.75, wall.end.y - 0.75);
  ctx.stroke();

  if (state.hovered && !state.selected) {
    ctx.strokeStyle = GOLD_HOVER;
    ctx.lineWidth = wall.thickness + 5;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.stroke();
  }

  ctx.strokeStyle = state.selected ? GOLD : (pranaActive ? INK : 'rgba(120, 120, 120, 0.8)');
  ctx.lineWidth = wall.thickness;
  ctx.lineCap = 'square';
  if (pranaActive) {
    ctx.shadowColor = state.selected ? GOLD : INK;
    ctx.shadowBlur = 15;
  }
  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  ctx.lineTo(wall.end.x, wall.end.y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = state.selected ? GOLD : (pranaActive ? INK : 'rgba(120, 120, 120, 0.8)');
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

  if (wall.fachwerk) {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(wall.start.x, wall.start.y);
    ctx.rotate(angle);
    
    ctx.strokeStyle = '#5c3d1e';
    ctx.lineWidth = Math.max(2, wall.thickness / 6);
    
    const interval = 40;
    const steps = Math.floor(len / interval);
    
    for (let i = 0; i <= steps; i++) {
      const x = i * interval;
      ctx.beginPath();
      ctx.moveTo(x, -wall.thickness / 2);
      ctx.lineTo(x, wall.thickness / 2);
      ctx.stroke();
      
      if (i < steps) {
        ctx.beginPath();
        ctx.moveTo(x, -wall.thickness / 2);
        ctx.lineTo(x + interval, wall.thickness / 2);
        ctx.moveTo(x, wall.thickness / 2);
        ctx.lineTo(x + interval, -wall.thickness / 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
}

export function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: Wall, unitSystem: UnitSystem) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const x = midX + Math.sin(angle) * 20;
  const y = midY - Math.cos(angle) * 20;

  ctx.fillStyle = CHIP_FILL;
  ctx.fillRect(x - 38, y - 13, 76, 26);
  ctx.strokeStyle = 'rgba(44, 28, 16, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 38, y - 11, 76, 26);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.strokeRect(x - 39, y - 14, 76, 26);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(x - 38, y - 13, 76, 26);
  ctx.fillStyle = INK;
  ctx.font = CANVAS_FONT_MONO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(length, unitSystem, 0), x, y);
}

export function drawOpening(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
  options: {
    hovered: boolean;
    selected?: boolean;
    dragging?: boolean;
    dragPositionPercent?: number;
    unitSystem: UnitSystem;
  },
) {
  const pranaActive = typeof document !== 'undefined' && document.documentElement.dataset.pranaActive === 'true';
  const highlighted = options.hovered || options.selected || options.dragging;

  if (pranaActive) {
    ctx.shadowColor = opening.type === 'door' ? DOOR : WINDOW;
    ctx.shadowBlur = 15;
  }

  if (opening.type === 'door') {
    drawDoorSymbol(ctx, wall, opening, { highlighted });
  } else {
    drawWindowSymbol(ctx, wall, opening, { highlighted });
  }
  
  ctx.shadowBlur = 0;

  if (options.selected || options.dragging) {
    drawOpeningDragHandles(ctx, wall, opening);
  }

  if (options.dragging && options.dragPositionPercent !== undefined) {
    drawOpeningHoverChip(ctx, wall, opening, {
      unitSystem: options.unitSystem,
      dragging: true,
      dragPositionPercent: options.dragPositionPercent,
    });
  }

  if (highlighted && !options.dragging) {
    drawOpeningHoverChip(ctx, wall, opening, {
      unitSystem: options.unitSystem,
      showDetails: true,
    });
  }
}

export function drawPreviewOpening(
  ctx: CanvasRenderingContext2D,
  preview: { position: Point2D; wallId: string; type: 'door' | 'window' },
  walls: Wall[],
  unitSystem: UnitSystem,
) {
  const wall = walls.find((item) => item.id === preview.wallId);
  if (!wall) return;

  const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (wallLength === 0) return;

  const position = ((preview.position.x - wall.start.x) * (wall.end.x - wall.start.x)
    + (preview.position.y - wall.start.y) * (wall.end.y - wall.start.y))
    / (wallLength * wallLength);

  const previewOpening: Opening = {
    id: 'preview',
    type: preview.type,
    wallId: preview.wallId,
    position: Math.max(0, Math.min(1, position)),
    width: preview.type === 'door' ? 90 : 120,
    height: preview.type === 'door' ? 210 : 120,
  };

  if (preview.type === 'door') {
    drawDoorSymbol(ctx, wall, previewOpening, { preview: true, highlighted: true });
  } else {
    drawWindowSymbol(ctx, wall, previewOpening, { preview: true, highlighted: true });
  }

  const color = preview.type === 'door' ? DOOR : WINDOW;
  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const labelX = preview.position.x + Math.sin(wallAngle) * 35;
  const labelY = preview.position.y - Math.cos(wallAngle) * 35;
  const width = preview.type === 'door' ? 90 : 120;
  const height = preview.type === 'door' ? 210 : 120;

  ctx.fillStyle = CHIP_FILL_ALPHA;
  ctx.fillRect(labelX - 40, labelY - 20, 80, 40);
  ctx.strokeStyle = color;
  ctx.strokeRect(labelX - 40, labelY - 20, 80, 40);
  ctx.fillStyle = INK;
  ctx.font = CANVAS_FONT_MONO_SM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preview.type.toUpperCase(), labelX, labelY - 8);
  ctx.font = CANVAS_FONT_MONO_XS;
  ctx.fillText(
    `${formatDimensionBySystem(width * 2, unitSystem, 0)} × ${formatDimensionBySystem(height * 2, unitSystem, 0)}`,
    labelX,
    labelY + 6,
  );
}

export function drawWallPreview(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  end: Point2D,
  walls: Wall[],
  unitSystem: UnitSystem,
) {
  ctx.strokeStyle = GOLD_PREVIEW;
  ctx.lineWidth = 10;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  ctx.fillStyle = CHIP_FILL;
  ctx.fillRect(midX - 34, midY - 20, 68, 20);
  ctx.fillStyle = INK;
  ctx.font = CANVAS_FONT_MONO.replace('bold ', '');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(Math.hypot(end.x - start.x, end.y - start.y), unitSystem, 0), midX, midY - 10);

  const snapped = walls.some(
    (wall) =>
      Math.hypot(end.x - wall.start.x, end.y - wall.start.y) < 1 ||
      Math.hypot(end.x - wall.end.x, end.y - wall.end.y) < 1,
  );
  if (snapped) {
    ctx.strokeStyle = GOLD_BRIGHT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawDimension(
  ctx: CanvasRenderingContext2D,
  dimension: DimensionAnnotation,
  unitSystem: UnitSystem,
  preview = false,
) {
  const length = Math.hypot(dimension.end.x - dimension.start.x, dimension.end.y - dimension.start.y);
  const dx = dimension.end.x - dimension.start.x;
  const dy = dimension.end.y - dimension.start.y;
  const angle = Math.atan2(dy, dx);
  const offset = dimension.offset ?? 24;
  const perpX = Math.sin(angle) * offset;
  const perpY = -Math.cos(angle) * offset;

  const dimStart = { x: dimension.start.x + perpX, y: dimension.start.y + perpY };
  const dimEnd = { x: dimension.end.x + perpX, y: dimension.end.y + perpY };
  const midX = (dimStart.x + dimEnd.x) / 2;
  const midY = (dimStart.y + dimEnd.y) / 2;

  const strokeColor = preview ? GOLD_PREVIEW : GOLD;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = preview ? 1 : 1.5;
  ctx.setLineDash([4, 3]);

  for (const [from, to] of [
    [dimension.start, dimStart],
    [dimension.end, dimEnd],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.lineWidth = preview ? 1 : 2;
  ctx.beginPath();
  ctx.moveTo(dimStart.x, dimStart.y);
  ctx.lineTo(dimEnd.x, dimEnd.y);
  ctx.stroke();

  const tick = 6;
  for (const point of [dimStart, dimEnd]) {
    ctx.beginPath();
    ctx.moveTo(point.x - Math.sin(angle) * tick, point.y + Math.cos(angle) * tick);
    ctx.lineTo(point.x + Math.sin(angle) * tick, point.y - Math.cos(angle) * tick);
    ctx.stroke();
  }

  ctx.fillStyle = preview ? CHIP_FILL_PREVIEW : CHIP_FILL;
  ctx.fillRect(midX - 38, midY - 13, 76, 26);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(midX - 38, midY - 13, 76, 26);
  ctx.fillStyle = INK;
  ctx.font = CANVAS_FONT_MONO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(length, unitSystem, 0), midX, midY);
}

export function drawWallEndpointHandles(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  options?: { activeEnd?: 'start' | 'end' },
) {
  const radius = 7;
  for (const end of ['start', 'end'] as const) {
    const point = end === 'start' ? wall.start : wall.end;
    const active = options?.activeEnd === end;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = active ? GOLD_BRIGHT : CHIP_FILL;
    ctx.fill();
    ctx.strokeStyle = active ? GOLD_BRIGHT : GOLD;
    ctx.lineWidth = active ? 2 : 1.5;
    ctx.stroke();
  }
}

export function pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const a = point.x - lineStart.x;
  const b = point.y - lineStart.y;
  const c = lineEnd.x - lineStart.x;
  const d = lineEnd.y - lineStart.y;
  const lenSq = c * c + d * d;
  const param = lenSq === 0 ? -1 : (a * c + b * d) / lenSq;

  const x = param < 0 ? lineStart.x : param > 1 ? lineEnd.x : lineStart.x + param * c;
  const y = param < 0 ? lineStart.y : param > 1 ? lineEnd.y : lineStart.y + param * d;

  return Math.hypot(point.x - x, point.y - y);
}
