// 2D Blueprint Canvas Component — pointer-first for mouse, touch, and Pencil-style input
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DimensionAnnotation, Label, Opening, Point2D, ToolType, Wall } from '@/types';
import {
  checkOpeningOverlap,
  isOpeningInBounds,
  type UnitSystem,
} from '@/utils/measurements';
import {
  drawDimension,
  drawGrid,
  drawOpening,
  drawPreviewOpening,
  drawWall,
  drawWallMeasurement,
  drawWallPreview,
  pointToLineDistance,
} from './blueprintCanvasDrawing';

interface BlueprintCanvasProps {
  walls: Wall[];
  openings: Opening[];
  labels?: Label[];
  dimensions?: DimensionAnnotation[];
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  onWallAdd: (wall: Wall) => void;
  onOpeningAdd: (opening: Opening) => void;
  onOpeningUpdate?: (openingId: string, updates: Partial<Opening>) => void;
  onLabelAdd?: (label: Label) => void;
  onDimensionAdd?: (dimension: DimensionAnnotation) => void;
  onWallSelect: (wallId: string | undefined) => void;
  onOpeningSelect?: (openingId: string | undefined) => void;
  selectedWallId?: string;
  selectedOpeningId?: string;
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

function positionOnWall(point: Point2D, wall: Wall): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.hypot(dx, dy);
  if (wallLength === 0) return 0;
  return Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength)));
}

function snapOpeningPosition(position: number): number {
  const endpointThreshold = 0.08;
  if (position < endpointThreshold) return 0;
  if (position > 1 - endpointThreshold) return 1;
  return position;
}

export default function BlueprintCanvas({
  walls,
  openings,
  labels = [],
  dimensions = [],
  currentTool,
  gridVisible,
  snapEnabled,
  gridSize,
  onWallAdd,
  onOpeningAdd,
  onOpeningUpdate,
  onLabelAdd,
  onDimensionAdd,
  onWallSelect,
  onOpeningSelect,
  selectedWallId,
  selectedOpeningId,
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
  const [draggingOpeningId, setDraggingOpeningId] = useState<string | null>(null);
  const [dimensionStart, setDimensionStart] = useState<Point2D | null>(null);

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
    const position = snapOpeningPosition(positionOnWall(point, wall));

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
      const opening = getOpeningAtPoint(point, mode);
      if (opening) {
        onOpeningSelect?.(opening.id);
        onWallSelect(undefined);
        setDraggingOpeningId(opening.id);
        return;
      }

      onOpeningSelect?.(undefined);
      onWallSelect(getWallAtPoint(point, getHitArea(mode, 5))?.id);
      return;
    }

    if (currentTool === 'text') {
      onLabelAdd?.({
        id: `label-${Date.now()}`,
        text: 'Room',
        position: point,
        fontSize: 14,
        color: '#2c1810',
      });
      return;
    }

    if (currentTool === 'dimension') {
      if (!dimensionStart) {
        setDimensionStart(point);
        return;
      }

      onDimensionAdd?.({
        id: `dimension-${Date.now()}`,
        start: dimensionStart,
        end: point,
      });
      setDimensionStart(null);
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

    if (draggingOpeningId && onOpeningUpdate) {
      const opening = openings.find((item) => item.id === draggingOpeningId);
      const wall = opening ? walls.find((candidate) => candidate.id === opening.wallId) : undefined;
      if (opening && wall) {
        onOpeningUpdate(opening.id, { position: snapOpeningPosition(positionOnWall(point, wall)) });
      }
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
    setDraggingOpeningId(null);
    finishWallDrawing(event);
  };

  const handlePointerCancel = (event: CanvasPointerEvent) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingOpeningId(null);
    setDimensionStart(null);
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
        hovered: opening.id === hoveredOpening || opening.id === selectedOpeningId || currentTool === 'measure',
        unitSystem,
      });
    }

    for (const label of labels) {
      ctx.fillStyle = label.color ?? '#2c1810';
      ctx.font = `${label.fontSize ?? 14}px sans-serif`;
      ctx.fillText(label.text, label.position.x, label.position.y);
    }

    for (const dimension of dimensions) {
      drawDimension(ctx, dimension, unitSystem);
    }

    if (dimensionStart && hoveredPoint && currentTool === 'dimension') {
      drawDimension(ctx, { id: 'preview', start: dimensionStart, end: hoveredPoint }, unitSystem, true);
    }

    if (previewOpening) {
      drawPreviewOpening(ctx, previewOpening, walls, unitSystem);
    }

    if (isDrawing && startPoint && currentPoint) {
      drawWallPreview(ctx, startPoint, currentPoint, walls, unitSystem);
    }
  }, [currentPoint, currentTool, dimensionStart, dimensions, gridSize, gridVisible, hoveredOpening, hoveredPoint, hoveredWall, isDrawing, labels, openings, previewOpening, selectedOpeningId, selectedWallId, snapEnabled, startPoint, unitSystem, walls]);

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
