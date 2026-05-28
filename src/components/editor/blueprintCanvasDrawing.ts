import type { DimensionAnnotation, Opening, Point2D, Wall } from '@/types';
import { formatDimensionBySystem, type UnitSystem } from '@/utils/measurements';

export function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gridSize: number) {
  ctx.strokeStyle = '#D4CFC4';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(184, 148, 31, 0.22)';
  ctx.lineWidth = 2;
  for (let x = 0; x < canvas.width; x += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

export function drawWall(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  state: { selected: boolean; hovered: boolean; snapEnabled: boolean },
) {
  if (state.hovered && !state.selected) {
    ctx.strokeStyle = 'rgba(184, 148, 31, 0.3)';
    ctx.lineWidth = wall.thickness + 4;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.stroke();
  }

  ctx.strokeStyle = state.selected ? '#B8941F' : '#2C2C2C';
  ctx.lineWidth = wall.thickness;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(wall.start.x, wall.start.y);
  ctx.lineTo(wall.end.x, wall.end.y);
  ctx.stroke();

  ctx.fillStyle = state.selected ? '#B8941F' : '#2C2C2C';
  for (const point of [wall.start, wall.end]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, wall.thickness / 2, 0, Math.PI * 2);
    ctx.fill();

    if (state.snapEnabled) {
      ctx.strokeStyle = '#B8941F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: Wall, unitSystem: UnitSystem) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const x = midX + Math.sin(angle) * 20;
  const y = midY - Math.cos(angle) * 20;

  ctx.fillStyle = '#F9F6F0';
  ctx.fillRect(x - 35, y - 12, 70, 24);
  ctx.strokeStyle = '#B8941F';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 35, y - 12, 70, 24);
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 11px "SF Mono", Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(length, unitSystem, 0), x, y);
}

export function drawOpening(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  opening: Opening,
  options: { hovered: boolean; unitSystem: UnitSystem },
) {
  const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
  const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
  const color = opening.type === 'door' ? '#C85A54' : '#C8963A';

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, options.hovered ? 10 : 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F5F1E8';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!options.hovered) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();

  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const labelX = x + Math.sin(wallAngle) * 40;
  const labelY = y - Math.cos(wallAngle) * 40;

  ctx.fillStyle = 'rgba(249, 246, 240, 0.95)';
  ctx.fillRect(labelX - 45, labelY - 22, 90, 44);
  ctx.strokeStyle = color;
  ctx.strokeRect(labelX - 45, labelY - 22, 90, 44);
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 10px "SF Mono", Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opening.type.toUpperCase(), labelX, labelY - 10);
  ctx.font = '9px "SF Mono", Monaco, monospace';
  ctx.fillText(`W: ${formatDimensionBySystem(opening.width * 2, options.unitSystem, 0)}`, labelX, labelY + 2);
  ctx.fillText(`H: ${formatDimensionBySystem(opening.height * 2, options.unitSystem, 0)}`, labelX, labelY + 12);
}

export function drawPreviewOpening(
  ctx: CanvasRenderingContext2D,
  preview: { position: Point2D; wallId: string; type: 'door' | 'window' },
  walls: Wall[],
  unitSystem: UnitSystem,
) {
  const wall = walls.find((item) => item.id === preview.wallId);
  if (!wall) return;

  const color = preview.type === 'door' ? '#C85A54' : '#C8963A';
  const width = preview.type === 'door' ? 90 : 120;
  const height = preview.type === 'door' ? 210 : 120;
  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const labelX = preview.position.x + Math.sin(wallAngle) * 35;
  const labelY = preview.position.y - Math.cos(wallAngle) * 35;

  ctx.fillStyle = preview.type === 'door' ? 'rgba(200, 90, 84, 0.4)' : 'rgba(200, 150, 58, 0.4)';
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(249, 246, 240, 0.95)';
  ctx.fillRect(labelX - 40, labelY - 20, 80, 40);
  ctx.strokeStyle = color;
  ctx.strokeRect(labelX - 40, labelY - 20, 80, 40);
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 10px "SF Mono", Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preview.type.toUpperCase(), labelX, labelY - 8);
  ctx.font = '9px "SF Mono", Monaco, monospace';
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
  ctx.strokeStyle = 'rgba(184, 148, 31, 0.6)';
  ctx.lineWidth = 10;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  ctx.fillStyle = '#F9F6F0';
  ctx.fillRect(midX - 34, midY - 20, 68, 20);
  ctx.fillStyle = '#2C2C2C';
  ctx.font = '12px "SF Mono", Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(Math.hypot(end.x - start.x, end.y - start.y), unitSystem, 0), midX, midY - 10);

  const snapped = walls.some(
    (wall) =>
      Math.hypot(end.x - wall.start.x, end.y - wall.start.y) < 1 ||
      Math.hypot(end.x - wall.end.x, end.y - wall.end.y) < 1,
  );
  if (snapped) {
    ctx.strokeStyle = '#CF9B3A';
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
  const midX = (dimension.start.x + dimension.end.x) / 2;
  const midY = (dimension.start.y + dimension.end.y) / 2;

  ctx.strokeStyle = preview ? 'rgba(184, 148, 31, 0.6)' : '#B8941F';
  ctx.lineWidth = preview ? 1 : 2;
  ctx.beginPath();
  ctx.moveTo(dimension.start.x, dimension.start.y);
  ctx.lineTo(dimension.end.x, dimension.end.y);
  ctx.stroke();

  ctx.fillStyle = preview ? 'rgba(249, 246, 240, 0.85)' : '#F9F6F0';
  ctx.fillRect(midX - 36, midY - 12, 72, 24);
  ctx.strokeStyle = '#B8941F';
  ctx.lineWidth = 1;
  ctx.strokeRect(midX - 36, midY - 12, 72, 24);
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 11px "SF Mono", Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatDimensionBySystem(length, unitSystem, 0), midX, midY);
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
