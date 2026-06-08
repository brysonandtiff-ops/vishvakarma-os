// 2D Blueprint Canvas Component — pointer-first for mouse, touch, and Pencil-style input
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type {
  DimensionAnnotation,
  FurnitureItem,
  Label,
  LandscapeElement,
  MepSymbol,
  Opening,
  Point2D,
  Room,
  ToolType,
  Wall,
} from '@/types';
import { buildOrderedVertices } from '@/utils/roomCalculations';
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
  rooms?: Room[];
  furniture?: FurnitureItem[];
  mepSymbols?: MepSymbol[];
  landscapeElements?: LandscapeElement[];
  northOrientation?: number;
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  onWallAdd: (wall: Wall) => void;
  onOpeningAdd: (opening: Opening) => void;
  onOpeningUpdate?: (openingId: string, updates: Partial<Opening>) => void;
  onLabelAdd?: (label: Label) => void;
  onLabelUpdate?: (labelId: string, updates: Partial<Label>) => void;
  onDimensionAdd?: (dimension: DimensionAnnotation) => void;
  dimensionVisibility?: boolean;
  onRoomDetect?: (point: Point2D) => void;
  onFurnitureAdd?: (item: FurnitureItem) => void;
  onFurnitureUpdate?: (furnitureId: string, updates: Partial<FurnitureItem>) => void;
  selectedLabelId?: string;
  onLabelSelect?: (labelId: string | undefined) => void;
  onMepSymbolAdd?: (symbol: MepSymbol) => void;
  onLandscapeAdd?: (element: LandscapeElement) => void;
  onPointerCanvasMove?: (point: Point2D) => void;
  onWallSelect: (wallId: string | undefined) => void;
  onOpeningSelect?: (openingId: string | undefined) => void;
  selectedWallId?: string;
  selectedOpeningId?: string;
  unitSystem?: UnitSystem;
}

const FURNITURE_PRESETS = [
  { type: 'bed', width: 140, depth: 200 },
  { type: 'table', width: 120, depth: 80 },
  { type: 'chair', width: 50, depth: 50 },
  { type: 'sofa', width: 180, depth: 90 },
] as const;

const MEP_TYPES: MepSymbol['type'][] = ['outlet', 'switch', 'hvac', 'panel'];
const LANDSCAPE_TYPES = ['tree', 'shrub', 'path'] as const;

const MEP_COLORS: Record<MepSymbol['type'], string> = {
  outlet: '#2563eb',
  switch: '#ca8a04',
  hvac: '#0891b2',
  panel: '#7c3aed',
};

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
  rooms = [],
  furniture = [],
  mepSymbols = [],
  landscapeElements = [],
  northOrientation = 0,
  currentTool,
  gridVisible,
  snapEnabled,
  gridSize,
  onWallAdd,
  onOpeningAdd,
  onOpeningUpdate,
  onLabelAdd,
  onLabelUpdate,
  onDimensionAdd,
  dimensionVisibility = true,
  onRoomDetect,
  onFurnitureAdd,
  onFurnitureUpdate,
  onMepSymbolAdd,
  selectedLabelId,
  onLabelSelect,
  onLandscapeAdd,
  onPointerCanvasMove,
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
  const [dragOpeningPosition, setDragOpeningPosition] = useState<number | null>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const gridLayerRef = useRef<HTMLCanvasElement | null>(null);
  const [gridLayerRevision, setGridLayerRevision] = useState(0);
  const [dragFurniturePosition, setDragFurniturePosition] = useState<Point2D | null>(null);
  const [dimensionStart, setDimensionStart] = useState<Point2D | null>(null);
  const [furniturePresetIndex, setFurniturePresetIndex] = useState(0);
  const [mepTypeIndex, setMepTypeIndex] = useState(0);
  const [landscapeTypeIndex, setLandscapeTypeIndex] = useState(0);

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
      const pos = opening.id === draggingOpeningId && dragOpeningPosition !== null
        ? dragOpeningPosition
        : opening.position;
      const x = wall.start.x + (wall.end.x - wall.start.x) * pos;
      const y = wall.start.y + (wall.end.y - wall.start.y) * pos;
      return Math.hypot(point.x - x, point.y - y) < getHitArea(mode, 15);
    }), [dragOpeningPosition, draggingOpeningId, openings, walls]);

  const getLabelAtPoint = useCallback(
    (point: Point2D) => labels.find((label) => {
      const size = (label.fontSize ?? 14) * (label.text.length * 0.45);
      return (
        point.x >= label.position.x - 4 &&
        point.x <= label.position.x + size &&
        point.y >= label.position.y - (label.fontSize ?? 14) &&
        point.y <= label.position.y + 4
      );
    }),
    [labels],
  );

  const getFurnitureAtPoint = useCallback(
    (point: Point2D, mode: InputMode) => furniture.find((item) => {
      const width = item.width ?? 80;
      const depth = item.depth ?? 60;
      return (
        Math.abs(point.x - item.position.x) < width / 2 + getHitArea(mode, 4) &&
        Math.abs(point.y - item.position.y) < depth / 2 + getHitArea(mode, 4)
      );
    }),
    [furniture],
  );

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
        onLabelSelect?.(undefined);
        setDraggingOpeningId(opening.id);
        setDragOpeningPosition(opening.position);
        return;
      }

      const furnitureItem = getFurnitureAtPoint(point, mode);
      if (furnitureItem && onFurnitureUpdate) {
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onLabelSelect?.(undefined);
        setDraggingFurnitureId(furnitureItem.id);
        setDragFurniturePosition(furnitureItem.position);
        return;
      }

      const label = getLabelAtPoint(point);
      if (label) {
        onLabelSelect?.(label.id);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        return;
      }

      onOpeningSelect?.(undefined);
      onLabelSelect?.(undefined);
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

    if (currentTool === 'room') {
      onRoomDetect?.(point);
      return;
    }

    if (currentTool === 'furniture') {
      const preset = FURNITURE_PRESETS[furniturePresetIndex % FURNITURE_PRESETS.length];
      onFurnitureAdd?.({
        id: `furniture-${Date.now()}`,
        type: preset.type,
        position: point,
        width: preset.width,
        depth: preset.depth,
        rotation: 0,
      });
      setFurniturePresetIndex((index) => (index + 1) % FURNITURE_PRESETS.length);
      return;
    }

    if (currentTool === 'mep') {
      const type = MEP_TYPES[mepTypeIndex % MEP_TYPES.length];
      onMepSymbolAdd?.({
        id: `mep-${Date.now()}`,
        type,
        position: point,
      });
      setMepTypeIndex((index) => (index + 1) % MEP_TYPES.length);
      return;
    }

    if (currentTool === 'landscape') {
      const type = LANDSCAPE_TYPES[landscapeTypeIndex % LANDSCAPE_TYPES.length];
      onLandscapeAdd?.({
        id: `landscape-${Date.now()}`,
        type,
        position: point,
      });
      setLandscapeTypeIndex((index) => (index + 1) % LANDSCAPE_TYPES.length);
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
    onPointerCanvasMove?.(point);

    if (isDrawing && startPoint && currentTool === 'wall') {
      setCurrentPoint(point);
      return;
    }

    if (draggingOpeningId) {
      const opening = openings.find((item) => item.id === draggingOpeningId);
      const wall = opening ? walls.find((candidate) => candidate.id === opening.wallId) : undefined;
      if (opening && wall) {
        setDragOpeningPosition(snapOpeningPosition(positionOnWall(point, wall)));
      }
      return;
    }

    if (draggingFurnitureId) {
      setDragFurniturePosition(point);
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

    if (draggingOpeningId && onOpeningUpdate && dragOpeningPosition !== null) {
      onOpeningUpdate(draggingOpeningId, { position: dragOpeningPosition });
    }

    if (draggingFurnitureId && onFurnitureUpdate && dragFurniturePosition) {
      onFurnitureUpdate(draggingFurnitureId, { position: dragFurniturePosition });
    }

    setDraggingOpeningId(null);
    setDragOpeningPosition(null);
    setDraggingFurnitureId(null);
    setDragFurniturePosition(null);
    finishWallDrawing(event);
  };

  const handleDoubleClick = (event: CanvasPointerEvent) => {
    const point = getCanvasPoint(event);
    const label = getLabelAtPoint(point);
    if (!label || !onLabelUpdate) return;
    setEditingLabelId(label.id);
    setEditingLabelText(label.text);
    onLabelSelect?.(label.id);
  };

  const commitLabelEdit = () => {
    if (editingLabelId && onLabelUpdate && editingLabelText.trim()) {
      onLabelUpdate(editingLabelId, { text: editingLabelText.trim() });
    }
    setEditingLabelId(null);
    setEditingLabelText('');
  };

  const handlePointerCancel = (event: CanvasPointerEvent) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingOpeningId(null);
    setDragOpeningPosition(null);
    setDraggingFurnitureId(null);
    setDragFurniturePosition(null);
    setDimensionStart(null);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setPreviewOpening(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!gridLayerRef.current) {
      gridLayerRef.current = document.createElement('canvas');
    }
    const gridLayer = gridLayerRef.current;
    gridLayer.width = canvas.width;
    gridLayer.height = canvas.height;
    const gridCtx = gridLayer.getContext('2d');
    if (gridCtx && gridVisible) {
      gridCtx.fillStyle = '#F5F1E8';
      gridCtx.fillRect(0, 0, gridLayer.width, gridLayer.height);
      drawGrid(gridCtx, canvas, gridSize);
    }
    setGridLayerRevision((r) => r + 1);
  }, [gridSize, gridVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#F5F1E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gridVisible && gridLayerRef.current) {
      ctx.drawImage(gridLayerRef.current, 0, 0);
    } else if (gridVisible) {
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
        selected: opening.id === selectedOpeningId,
        dragging: opening.id === draggingOpeningId,
        dragPositionPercent: opening.id === draggingOpeningId ? dragOpeningPosition ?? undefined : undefined,
        unitSystem,
      });
    }

    for (const label of labels) {
      const isSelected = label.id === selectedLabelId;
      ctx.fillStyle = label.color ?? '#2c1810';
      ctx.font = `${label.fontSize ?? 14}px sans-serif`;
      if (isSelected) {
        const textWidth = ctx.measureText(label.text).width;
        ctx.strokeStyle = '#B8941F';
        ctx.lineWidth = 1;
        ctx.strokeRect(label.position.x - 4, label.position.y - (label.fontSize ?? 14), textWidth + 8, (label.fontSize ?? 14) + 8);
      }
      ctx.fillText(label.text, label.position.x, label.position.y);
    }

    for (const room of rooms) {
      const roomWalls = walls.filter((wall) => room.wallIds.includes(wall.id));
      const vertices = buildOrderedVertices(roomWalls);
      if (vertices.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(180, 140, 60, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(180, 140, 60, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (room.center) {
        ctx.fillStyle = '#6b4f2a';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${room.name}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`, room.center.x, room.center.y);
      }
    }

    for (const item of furniture) {
      const width = item.width ?? 80;
      const depth = item.depth ?? 60;
      const pos = item.id === draggingFurnitureId && dragFurniturePosition
        ? dragFurniturePosition
        : item.position;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180);
      ctx.fillStyle = 'rgba(92, 64, 51, 0.35)';
      ctx.strokeStyle = '#5c4033';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-width / 2, -depth / 2, width, depth);
      ctx.strokeRect(-width / 2, -depth / 2, width, depth);
      ctx.fillStyle = '#3d2b1f';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.type, 0, 4);
      ctx.restore();
    }

    for (const symbol of mepSymbols) {
      ctx.beginPath();
      ctx.arc(symbol.position.x, symbol.position.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = MEP_COLORS[symbol.type];
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(symbol.type.slice(0, 1).toUpperCase(), symbol.position.x, symbol.position.y + 3);
    }

    for (const element of landscapeElements) {
      if (element.type === 'tree') {
        ctx.beginPath();
        ctx.arc(element.position.x, element.position.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 120, 60, 0.55)';
        ctx.fill();
        ctx.fillStyle = '#5c3d1e';
        ctx.fillRect(element.position.x - 3, element.position.y + 8, 6, 10);
      } else if (element.type === 'shrub') {
        ctx.beginPath();
        ctx.arc(element.position.x, element.position.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 125, 50, 0.5)';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(element.position.x - 16, element.position.y);
        ctx.lineTo(element.position.x + 16, element.position.y);
        ctx.stroke();
      }
    }

    if (currentTool === 'vastu' || northOrientation !== 0) {
      const center = { x: canvas.width - 72, y: 72 };
      const radius = 42;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(((northOrientation - 90) * Math.PI) / 180);
      ctx.strokeStyle = 'rgba(180, 140, 60, 0.8)';
      ctx.fillStyle = 'rgba(180, 140, 60, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -radius + 6);
      ctx.lineTo(0, radius - 6);
      ctx.moveTo(-radius + 6, 0);
      ctx.lineTo(radius - 6, 0);
      ctx.stroke();
      ctx.fillStyle = '#b48c3c';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', 0, -radius + 18);
      ctx.restore();
    }

    if (dimensionVisibility) {
      for (const dimension of dimensions) {
        drawDimension(ctx, dimension, unitSystem);
      }
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
  }, [currentPoint, currentTool, dimensionStart, dimensionVisibility, dimensions, dragFurniturePosition, dragOpeningPosition, draggingFurnitureId, draggingOpeningId, furniture, gridLayerRevision, gridSize, gridVisible, hoveredOpening, hoveredPoint, hoveredWall, isDrawing, labels, landscapeElements, mepSymbols, northOrientation, openings, previewOpening, rooms, selectedLabelId, selectedOpeningId, selectedWallId, snapEnabled, startPoint, unitSystem, walls]);

  return (
    <div className="relative">
    {editingLabelId && (
      <input
        type="text"
        value={editingLabelText}
        onChange={(e) => setEditingLabelText(e.target.value)}
        onBlur={commitLabelEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitLabelEdit();
          if (e.key === 'Escape') {
            setEditingLabelId(null);
            setEditingLabelText('');
          }
        }}
        className="absolute z-10 rounded border border-primary bg-background px-2 py-1 text-sm shadow-md"
        style={{
          left: labels.find((l) => l.id === editingLabelId)?.position.x ?? 0,
          top: (labels.find((l) => l.id === editingLabelId)?.position.y ?? 0) - 28,
        }}
        autoFocus
        aria-label="Edit label text"
      />
    )}
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="architect-canvas cursor-crosshair-precise touch-none select-none rounded-lg shadow-sm"
      data-testid="blueprint-canvas"
      data-input-mode={inputMode}
      aria-label="2D blueprint drawing canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={() => {
        if (isDrawing) return;
        setHoveredWall(null);
        setHoveredOpening(null);
        setPreviewOpening(null);
      }}
    />
    </div>
  );
}
