// 2D Blueprint Canvas Component — pointer-first for mouse, touch, and Pencil-style input
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Opening, Point2D, ToolType, Wall } from '@/types';
import {
  checkOpeningOverlap,
  formatDimensionBySystem,
  isOpeningInBounds,
  type UnitSystem,
} from '@/utils/measurements';

interface BlueprintCanvasProps {
  walls: Wall[];
  openings: Opening[];
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  onWallAdd: (wall: Wall) => void;
  onOpeningAdd: (opening: Opening) => void;
  onWallSelect: (wallId: string | undefined) => void;
  selectedWallId?: string;
  unitSystem?: UnitSystem;
}

type CanvasPointerEvent = PointerEvent<HTMLCanvasElement>;
type InputMode = 'mouse' | 'touch' | 'pen';

function getHitArea(mode: InputMode, base = 10) {
  if (mode === 'pen') return base + 8;
  if (mode === 'touch') return base + 16;
  return base;
}

function getInputMode(event: CanvasPointerEvent): InputMode {
  if (event.pointerType === 'pen') return 'pen';
  if (event.pointerType === 'touch') return 'touch';
  return 'mouse';
}

export default function BlueprintCanvas({
  walls,
  openings,
  currentTool,
  gridVisible,
  snapEnabled,
  gridSize,
  onWallAdd,
  onOpeningAdd,
  onWallSelect,
  selectedWallId,
  unitSystem = 'metric',
}: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point2D | null>(null);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  const [hoveredOpening, setHoveredOpening] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('mouse');
  const [previewOpening, setPreviewOpening] = useState<{
    position: Point2D;
    wallId: string;
    type: 'door' | 'window';
  } | null>(null);

  const snapToGrid = useCallback(
    (point: Point2D): Point2D => {
      if (!snapEnabled) return point;
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      };
    },
    [gridSize, snapEnabled]
  );

  const snapToNearbyEndpoint = useCallback(
    (point: Point2D, snapDistance = 20): Point2D => {
      if (!snapEnabled) return point;

      let closest: Point2D | null = null;
      let minDistance = snapDistance;

      for (const wall of walls) {
        for (const endpoint of [wall.start, wall.end]) {
          const distance = Math.hypot(point.x - endpoint.x, point.y - endpoint.y);
          if (distance < minDistance) {
            minDistance = distance;
            closest = endpoint;
          }
        }
      }

      return closest ?? point;
    },
    [snapEnabled, walls]
  );

  const getCanvasPoint = useCallback(
    (event: Pick<CanvasPointerEvent, 'clientX' | 'clientY'>): Point2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return snapToNearbyEndpoint(
        snapToGrid({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      );
    },
    [snapToGrid, snapToNearbyEndpoint]
  );

  const getWallAtPoint = useCallback(
    (point: Point2D, extraHitArea = 10) =>
      walls.find((wall) => pointToLineDistance(point, wall.start, wall.end) < wall.thickness / 2 + extraHitArea),
    [walls]
  );

  const getOpeningAtPoint = useCallback(
    (point: Point2D, mode: InputMode) => openings.find((opening) => {
      const wall = walls.find((candidate) => candidate.id === opening.wallId);
      if (!wall) return false;
      const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
      const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
      return Math.hypot(point.x - x, point.y - y) < getHitArea(mode, 15);
    }), [openings, walls]);

  const placeOpening = (point: Point2D, mode: InputMode) => {
    if (currentTool !== 'door' && currentTool !== 'window') return;

    const wall = getWallAtPoint(point, getHitArea(mode));
    if (!wall) return;

    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const position = Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength)));

    const opening: Opening = {
      id: `${currentTool}-${Date.now()}`,
      type: currentTool,
      wallId: wall.id,
      position,
      width: currentTool === 'door' ? 90 : 120,
      height: currentTool === 'door' ? 210 : 120,
      sillHeight: currentTool === 'window' ? 90 : undefined,
    };

    const wallOpenings = openings
      .filter((item) => item.wallId === wall.id)
      .map((item) => ({ position: item.position, width: item.width }));

    if (checkOpeningOverlap(opening.position, opening.width, wallLength, wallOpenings)) {
      console.warn('Opening overlaps with existing opening');
    }

    if (!isOpeningInBounds(opening.position, opening.width, wallLength)) {
      console.warn('Opening extends beyond wall boundaries');
    }

    onOpeningAdd(opening);
  };

  const handlePointerDown = (event: CanvasPointerEvent) => {
    event.preventDefault();
    const mode = getInputMode(event);
    setInputMode(mode);
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);

    if (currentTool === 'wall') {
      setStartPoint(point);
      setCurrentPoint(point);
      setIsDrawing(true);
      return;
    }

    if (currentTool === 'select') {
      onWallSelect(getWallAtPoint(point, getHitArea(mode, 5))?.id);
      return;
    }

    placeOpening(point, mode);
  };

  const handlePointerMove = (event: CanvasPointerEvent) => {
    event.preventDefault();
    const mode = getInputMode(event);
    setInputMode(mode);
    const point = getCanvasPoint(event);
    setHoveredPoint(point);

    if (isDrawing && startPoint && currentTool === 'wall') {
      setCurrentPoint(point);
      return;
    }

    const wall = getWallAtPoint(point, getHitArea(mode));
    const opening = getOpeningAtPoint(point, mode);
    setHoveredWall(wall?.id ?? null);
    setHoveredOpening(opening?.id ?? null);

    if ((currentTool === 'door' || currentTool === 'window') && wall) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const wallLength = Math.hypot(dx, dy);
      const t = Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength)));
      setPreviewOpening({
        position: { x: wall.start.x + dx * t, y: wall.start.y + dy * t },
        wallId: wall.id,
        type: currentTool,
      });
      return;
    }

    setPreviewOpening(null);
  };

  const finishWallDrawing = (event: CanvasPointerEvent) => {
    if (!isDrawing || !startPoint || currentTool !== 'wall') return;

    const end = getCanvasPoint(event);
    if (Math.hypot(end.x - startPoint.x, end.y - startPoint.y) > 10) {
      onWallAdd({
        id: `wall-${Date.now()}`,
        start: startPoint,
        end,
        thickness: 10,
        height: 240,
        material: 'material-paint',
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handlePointerUp = (event: CanvasPointerEvent) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishWallDrawing(event);
  };

  const handlePointerCancel = (event: CanvasPointerEvent) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setPreviewOpening(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#F5F1E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gridVisible) {
      drawGrid(ctx, canvas, gridSize);
    }

    for (const wall of walls) {
      drawWall(ctx, wall, {
        selected: wall.id === selectedWallId,
        hovered: wall.id === hoveredWall,
        snapEnabled,
      });

      if ((wall.id === selectedWallId || (wall.id === hoveredWall && currentTool === 'measure')) && !isDrawing) {
        drawWallMeasurement(ctx, wall, unitSystem);
      }
    }

    for (const opening of openings) {
      const wall = walls.find((item) => item.id === opening.wallId);
      if (!wall) continue;
      drawOpening(ctx, wall, opening, {
        hovered: opening.id === hoveredOpening || currentTool === 'measure',
        unitSystem,
      });
    }

    if (previewOpening) {
      drawPreviewOpening(ctx, previewOpening, walls, unitSystem);
    }

    if (isDrawing && startPoint && currentPoint) {
      drawWallPreview(ctx, startPoint, currentPoint, walls, unitSystem);
    }
  }, [currentPoint, currentTool, gridSize, gridVisible, hoveredOpening, hoveredWall, isDrawing, openings, previewOpening, selectedWallId, snapEnabled, startPoint, unitSystem, walls]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="architect-canvas cursor-crosshair-precise touch-none select-none rounded-lg shadow-sm"
      data-input-mode={inputMode}
      aria-label="2D blueprint drawing canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={() => {
        if (isDrawing) return;
        setHoveredWall(null);
        setHoveredOpening(null);
        setPreviewOpening(null);
      }}
    />
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gridSize: number) {
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

function drawWall(ctx: CanvasRenderingContext2D, wall: Wall, state: { selected: boolean; hovered: boolean; snapEnabled: boolean }) {
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

function drawWallMeasurement(ctx: CanvasRenderingContext2D, wall: Wall, unitSystem: UnitSystem) {
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

function drawOpening(ctx: CanvasRenderingContext2D, wall: Wall, opening: Opening, options: { hovered: boolean; unitSystem: UnitSystem }) {
  const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
  const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
  const color = opening.type === 'door' ? '#C85A54' : '#4A7BA7';

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

function drawPreviewOpening(ctx: CanvasRenderingContext2D, preview: { position: Point2D; wallId: string; type: 'door' | 'window' }, walls: Wall[], unitSystem: UnitSystem) {
  const wall = walls.find((item) => item.id === preview.wallId);
  if (!wall) return;

  const color = preview.type === 'door' ? '#C85A54' : '#4A7BA7';
  const width = preview.type === 'door' ? 90 : 120;
  const height = preview.type === 'door' ? 210 : 120;
  const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const labelX = preview.position.x + Math.sin(wallAngle) * 35;
  const labelY = preview.position.y - Math.cos(wallAngle) * 35;

  ctx.fillStyle = preview.type === 'door' ? 'rgba(200, 90, 84, 0.4)' : 'rgba(74, 123, 167, 0.4)';
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
  ctx.fillText(`${formatDimensionBySystem(width * 2, unitSystem, 0)} × ${formatDimensionBySystem(height * 2, unitSystem, 0)}`, labelX, labelY + 6);
}

function drawWallPreview(ctx: CanvasRenderingContext2D, start: Point2D, end: Point2D, walls: Wall[], unitSystem: UnitSystem) {
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

  const snapped = walls.some((wall) => Math.hypot(end.x - wall.start.x, end.y - wall.start.y) < 1 || Math.hypot(end.x - wall.end.x, end.y - wall.end.y) < 1);
  if (snapped) {
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
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
