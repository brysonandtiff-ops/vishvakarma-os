// 2D Blueprint Canvas Component — pointer-first for mouse, touch, and Pencil-style input
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { mapCanvasBufferToDisplay, mapCanvasBufferToWorld, mapPointerToCanvasBuffer, mapPointerToWorldCoords, mapWorldToCanvasBuffer } from '@/utils/canvasPointerCoords';
import type {
  DimensionAnnotation,
  FixtureItem,
  FurnitureItem,
  Label,
  LandscapeElement,
  MepSymbol,
  Opening,
  Point2D,
  Room,
  Staircase,
  TerrainPatch,
  ToolType,
  Wall,
  CanvasViewportState,
} from '@/types';
import { buildOrderedVertices, getVerticesForRoom } from '@/utils/roomCalculations';
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
import {
  drawFurniture2D,
  drawLandscape2D,
  drawStair2D,
  FURNITURE_PRESETS,
  getLandscapeDefaults,
  LANDSCAPE_TYPES,
} from '@/core/sceneVisualCatalog';
import {
  isWallSelected,
  normalizeSelectionRect,
  toggleWallInSelection,
  wallsInSelectionRect,
  type SelectionRect,
} from '@/editor/canvasSelection';
import {
  COMPASS_FILL,
  COMPASS_STROKE,
  FIXTURE_LABEL,
  FIXTURE_MEP_LABEL,
  FIXTURE_MEP_STROKE,
  FIXTURE_STROKE,
  GOLD,
  GOLD_GLOW,
  GOLD_GLOW_SOFT,
  GOLD_LIGHT,
  GOLD_MUTED,
  CANVAS_PAPER_FILL,
  INK_LABEL,
  MEP_COLORS,
  ROOM_FILL,
  ROOM_LABEL,
  ROOM_STROKE,
} from '@/core/sceneDrawingTokens';
import {
  drawTerrain2D,
  drawTerrainPreview,
  getTerrainElevationPreset,
  isValidTerrainPolygon,
  pointsNear,
} from '@/core/sceneTerrainCatalog';
import { computeVastuOverlayRadius, drawVastuSectorOverlay } from '@/core/simulations/vastuOverlay';

interface BlueprintCanvasProps {
  walls: Wall[];
  openings: Opening[];
  labels?: Label[];
  dimensions?: DimensionAnnotation[];
  rooms?: Room[];
  furniture?: FurnitureItem[];
  staircases?: Staircase[];
  mepSymbols?: MepSymbol[];
  fixtures?: FixtureItem[];
  landscapeElements?: LandscapeElement[];
  terrain?: TerrainPatch[];
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
  onStaircaseAdd?: (staircase: Staircase) => void;
  selectedLabelId?: string;
  onLabelSelect?: (labelId: string | undefined) => void;
  onMepSymbolAdd?: (symbol: MepSymbol) => void;
  onFixtureAdd?: (fixture: FixtureItem) => void;
  onLandscapeAdd?: (element: LandscapeElement) => void;
  onTerrainAdd?: (patch: TerrainPatch) => void;
  selectedFixtureId?: string;
  onFixtureSelect?: (fixtureId: string | undefined) => void;
  onPointerCanvasMove?: (point: Point2D) => void;
  onWallSelect: (wallId: string | undefined) => void;
  onWallsSelect?: (wallIds: string[]) => void;
  onOpeningSelect?: (openingId: string | undefined) => void;
  selectedWallId?: string;
  selectedWallIds?: string[];
  selectedOpeningId?: string;
  unitSystem?: UnitSystem;
  canvasViewport?: CanvasViewportState;
  onCanvasViewportChange?: (viewport: Partial<CanvasViewportState>) => void;
  onResetViewport?: () => void;
  manifestWalls?: Wall[];
}

const MEP_TYPES: MepSymbol['type'][] = ['outlet', 'switch', 'hvac', 'panel'];
const FIXTURE_TYPES: FixtureItem['type'][] = ['point', 'spot', 'ceiling'];
type MepPlacement =
  | { kind: 'mep'; type: MepSymbol['type'] }
  | { kind: 'fixture'; type: FixtureItem['type'] };

const MEP_PLACEMENT_CYCLE: MepPlacement[] = [
  ...MEP_TYPES.map((type) => ({ kind: 'mep' as const, type })),
  ...FIXTURE_TYPES.map((type) => ({ kind: 'fixture' as const, type })),
];
const STAIR_DIRECTIONS = [0, 90, 180, 270];
const COLUMN_PRESET = FURNITURE_PRESETS.find((entry) => entry.type === 'column')!;
const LANDSCAPE_TYPE_CYCLE = [...LANDSCAPE_TYPES];

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
  staircases = [],
  mepSymbols = [],
  fixtures = [],
  landscapeElements = [],
  terrain = [],
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
  onStaircaseAdd,
  onMepSymbolAdd,
  onFixtureAdd,
  selectedFixtureId,
  onFixtureSelect,
  selectedLabelId,
  onLabelSelect,
  onLandscapeAdd,
  onTerrainAdd,
  onPointerCanvasMove,
  onWallSelect,
  onWallsSelect,
  onOpeningSelect,
  selectedWallId,
  selectedWallIds,
  selectedOpeningId,
  unitSystem = 'metric',
  canvasViewport = { panX: 0, panY: 0, zoom: 1 },
  onCanvasViewportChange,
  onResetViewport,
  manifestWalls,
}: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const canvasMetrics = useCanvasResize(containerRef);
  const { bottomInset: keyboardBottomInset } = useVisualViewportInset();
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
  const [dragFurniturePosition, setDragFurniturePosition] = useState<Point2D | null>(null);
  const [dimensionStart, setDimensionStart] = useState<Point2D | null>(null);
  const [furniturePresetIndex, setFurniturePresetIndex] = useState(0);
  const [mepPlacementIndex, setMepPlacementIndex] = useState(0);
  const [landscapeTypeIndex, setLandscapeTypeIndex] = useState(0);
  const [terrainVertices, setTerrainVertices] = useState<Point2D[]>([]);
  const [terrainElevationIndex, setTerrainElevationIndex] = useState(0);
  const [marqueeRect, setMarqueeRect] = useState<SelectionRect | null>(null);
  const [stairDirectionIndex, setStairDirectionIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const roomWallSource = manifestWalls ?? walls;

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
      const raw = mapPointerToWorldCoords(
        event.clientX,
        event.clientY,
        rect,
        canvas.width,
        canvas.height,
        canvasViewport,
      );
      return snapToNearbyEndpoint(snapToGrid(raw));
    },
    [canvasViewport, snapToGrid, snapToNearbyEndpoint],
  );

  const openLabelEdit = useCallback(
    (label: Label) => {
      if (!onLabelUpdate) return;
      setEditingLabelId(label.id);
      setEditingLabelText(label.text);
      onLabelSelect?.(label.id);
    },
    [onLabelSelect, onLabelUpdate],
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

  const getFixtureAtPoint = useCallback(
    (point: Point2D, mode: InputMode) => fixtures.find((fixture) => {
      const radius = 10 + getHitArea(mode, 2);
      return Math.hypot(point.x - fixture.position.x, point.y - fixture.position.y) <= radius;
    }),
    [fixtures],
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
    if (event.button === 1 || (event.button === 0 && event.shiftKey && onCanvasViewportChange)) {
      event.preventDefault();
      panOriginRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: canvasViewport.panX,
        panY: canvasViewport.panY,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

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
        onWallsSelect?.([]);
        onLabelSelect?.(undefined);
        setDraggingOpeningId(opening.id);
        setDragOpeningPosition(opening.position);
        return;
      }

      const furnitureItem = getFurnitureAtPoint(point, mode);
      if (furnitureItem && onFurnitureUpdate) {
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        onLabelSelect?.(undefined);
        setDraggingFurnitureId(furnitureItem.id);
        setDragFurniturePosition(furnitureItem.position);
        return;
      }

      const label = getLabelAtPoint(point);
      if (label) {
        if (selectedLabelId === label.id && onLabelUpdate) {
          openLabelEdit(label);
          return;
        }
        onLabelSelect?.(label.id);
        onFixtureSelect?.(undefined);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        return;
      }

      const fixture = getFixtureAtPoint(point, mode);
      if (fixture) {
        onFixtureSelect?.(fixture.id);
        onLabelSelect?.(undefined);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        return;
      }

      const wall = getWallAtPoint(point, getHitArea(mode, 5));
      if (wall) {
        const additive = event.shiftKey;
        const currentIds = selectedWallIds?.length
          ? selectedWallIds
          : selectedWallId
            ? [selectedWallId]
            : [];
        const nextIds = toggleWallInSelection(currentIds, wall.id, additive);
        if (onWallsSelect) {
          onWallsSelect(nextIds);
        } else {
          onWallSelect(nextIds[0]);
        }
        onOpeningSelect?.(undefined);
        onLabelSelect?.(undefined);
        onFixtureSelect?.(undefined);
        return;
      }

      onOpeningSelect?.(undefined);
      onLabelSelect?.(undefined);
      onFixtureSelect?.(undefined);
      setMarqueeRect({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
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

    if (currentTool === 'column') {
      onFurnitureAdd?.({
        id: `column-${Date.now()}`,
        type: COLUMN_PRESET.type,
        position: point,
        width: COLUMN_PRESET.width,
        depth: COLUMN_PRESET.depth,
        rotation: 0,
      });
      return;
    }

    if (currentTool === 'stair') {
      const direction = STAIR_DIRECTIONS[stairDirectionIndex % STAIR_DIRECTIONS.length];
      onStaircaseAdd?.({
        id: `stair-${Date.now()}`,
        position: point,
        direction,
      });
      setStairDirectionIndex((index) => index + 1);
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
      const placement = MEP_PLACEMENT_CYCLE[mepPlacementIndex % MEP_PLACEMENT_CYCLE.length];
      if (placement.kind === 'mep') {
        onMepSymbolAdd?.({
          id: `mep-${Date.now()}`,
          type: placement.type,
          position: point,
        });
      } else {
        onFixtureAdd?.({
          id: `fixture-${Date.now()}`,
          type: placement.type,
          position: point,
          intensity: 1,
        });
      }
      setMepPlacementIndex((index) => (index + 1) % MEP_PLACEMENT_CYCLE.length);
      return;
    }

    if (currentTool === 'landscape') {
      const type = LANDSCAPE_TYPE_CYCLE[landscapeTypeIndex % LANDSCAPE_TYPE_CYCLE.length];
      const landscapeDefaults = getLandscapeDefaults(type);
      onLandscapeAdd?.({
        id: `landscape-${Date.now()}`,
        type,
        position: point,
        ...(type === 'water' || type === 'rock'
          ? { width: landscapeDefaults.width, depth: landscapeDefaults.depth }
          : {}),
      });
      setLandscapeTypeIndex((index) => (index + 1) % LANDSCAPE_TYPE_CYCLE.length);
      return;
    }

    if (currentTool === 'terrain') {
      if (terrainVertices.length >= 3 && pointsNear(point, terrainVertices[0])) {
        if (isValidTerrainPolygon(terrainVertices)) {
          onTerrainAdd?.({
            id: `terrain-${Date.now()}`,
            points: [...terrainVertices],
            elevation: getTerrainElevationPreset(terrainElevationIndex),
          });
          setTerrainElevationIndex((index) => index + 1);
        }
        setTerrainVertices([]);
        return;
      }

      setTerrainVertices((vertices) => [...vertices, point]);
      return;
    }

    placeOpening(point, mode);
  };

  const handlePointerMove = (event: CanvasPointerEvent) => {
    event.preventDefault();
    const mode = getInputMode(event);
    setInputMode(mode);

    if (isPanning && panOriginRef.current && onCanvasViewportChange) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scaleX = canvas.width / canvas.getBoundingClientRect().width;
      const scaleY = canvas.height / canvas.getBoundingClientRect().height;
      const dx = (event.clientX - panOriginRef.current.clientX) * scaleX;
      const dy = (event.clientY - panOriginRef.current.clientY) * scaleY;
      onCanvasViewportChange({
        panX: panOriginRef.current.panX + dx,
        panY: panOriginRef.current.panY + dy,
      });
      return;
    }

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

    if (marqueeRect && currentTool === 'select') {
      setMarqueeRect({ ...marqueeRect, x2: point.x, y2: point.y });
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
    if (isPanning) {
      setIsPanning(false);
      panOriginRef.current = null;
    }
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

    if (marqueeRect && currentTool === 'select') {
      const end = getCanvasPoint(event);
      const rect: SelectionRect = { ...marqueeRect, x2: end.x, y2: end.y };
      const ids = wallsInSelectionRect(walls, rect);
      if (ids.length > 0) {
        onWallsSelect?.(ids);
        onOpeningSelect?.(undefined);
      } else {
        const { width, height } = normalizeSelectionRect(rect);
        if (width < 10 && height < 10) {
          onWallSelect(undefined);
          onWallsSelect?.([]);
          onOpeningSelect?.(undefined);
        }
      }
      setMarqueeRect(null);
    }

    finishWallDrawing(event);
  };

  const handleDoubleClick = (event: CanvasPointerEvent) => {
    const point = getCanvasPoint(event);
    const label = getLabelAtPoint(point);
    if (!label || !onLabelUpdate) return;
    openLabelEdit(label);
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
    setTerrainVertices([]);
    setMarqueeRect(null);
  };

  useEffect(() => {
    if (currentTool !== 'terrain') {
      setTerrainVertices([]);
    }
  }, [currentTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (terrainVertices.length > 0) {
          setTerrainVertices([]);
        }
        if (marqueeRect) {
          setMarqueeRect(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [marqueeRect, terrainVertices.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== canvasMetrics.bufferWidth || canvas.height !== canvasMetrics.bufferHeight) {
      canvas.width = canvasMetrics.bufferWidth;
      canvas.height = canvasMetrics.bufferHeight;
    }
  }, [canvasMetrics.bufferWidth, canvasMetrics.bufferHeight]);

  useEffect(() => {
    if (editingLabelId) {
      labelInputRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [editingLabelId, keyboardBottomInset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onCanvasViewportChange) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const buffer = mapPointerToCanvasBuffer(
        event.clientX,
        event.clientY,
        rect,
        canvas.width,
        canvas.height,
      );
      const worldBefore = mapCanvasBufferToWorld(buffer, canvasViewport);
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(4, Math.max(0.25, canvasViewport.zoom * factor));
      onCanvasViewportChange({
        zoom: newZoom,
        panX: buffer.x - worldBefore.x * newZoom,
        panY: buffer.y - worldBefore.y * newZoom,
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [canvasViewport, onCanvasViewportChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = CANVAS_PAPER_FILL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvasViewport.panX, canvasViewport.panY);
    ctx.scale(canvasViewport.zoom, canvasViewport.zoom);

    if (gridVisible) {
      drawGrid(ctx, canvas, gridSize);
    }

    for (const wall of walls) {
      const selected = isWallSelected(wall.id, selectedWallId, selectedWallIds);
      drawWall(ctx, wall, {
        selected,
        hovered: wall.id === hoveredWall,
        snapEnabled,
      });

      if ((selected || (wall.id === hoveredWall && currentTool === 'measure')) && !isDrawing) {
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
      ctx.fillStyle = label.color ?? INK_LABEL;
      ctx.font = `${label.fontSize ?? 14}px sans-serif`;
      if (isSelected) {
        const textWidth = ctx.measureText(label.text).width;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1;
        ctx.strokeRect(label.position.x - 4, label.position.y - (label.fontSize ?? 14), textWidth + 8, (label.fontSize ?? 14) + 8);
      }
      ctx.fillText(label.text, label.position.x, label.position.y);
    }

    for (const room of rooms) {
      const vertices = getVerticesForRoom(room, roomWallSource);
      if (vertices.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = ROOM_FILL;
        ctx.fill();
        ctx.strokeStyle = ROOM_STROKE;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      if (room.center) {
        ctx.fillStyle = ROOM_LABEL;
        ctx.font = '12px sans-serif';
        ctx.fillText(`${room.name}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`, room.center.x, room.center.y);
      }
    }

    for (const item of furniture) {
      const pos = item.id === draggingFurnitureId && dragFurniturePosition
        ? dragFurniturePosition
        : item.position;
      drawFurniture2D(ctx, item, pos, item.id === draggingFurnitureId);
    }

    for (const staircase of staircases) {
      drawStair2D(ctx, staircase.position, staircase.direction ?? 0);
    }

    for (const symbol of mepSymbols) {
      const { x, y } = symbol.position;
      const r = 9;
      ctx.beginPath();
      ctx.roundRect(x - r, y - r, r * 2, r * 2, 3);
      ctx.fillStyle = MEP_COLORS[symbol.type];
      ctx.fill();
      ctx.strokeStyle = FIXTURE_MEP_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.fillStyle = FIXTURE_MEP_LABEL;
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol.type.slice(0, 1).toUpperCase(), x, y);
    }

    for (const fixture of fixtures) {
      const { x, y } = fixture.position;
      const selected = fixture.id === selectedFixtureId;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = selected ? GOLD_GLOW : GOLD_GLOW_SOFT;
      ctx.fill();
      ctx.strokeStyle = selected ? GOLD_LIGHT : GOLD_MUTED;
      ctx.lineWidth = selected ? 2 : 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x - 4, y + 2);
      ctx.lineTo(x + 4, y + 2);
      ctx.closePath();
      ctx.fillStyle = GOLD_LIGHT;
      ctx.fill();
      ctx.strokeStyle = FIXTURE_STROKE;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = FIXTURE_LABEL;
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fixture.type.slice(0, 1).toUpperCase(), x, y + 14);
    }

    for (const patch of terrain) {
      drawTerrain2D(ctx, patch);
    }

    for (const element of landscapeElements) {
      drawLandscape2D(ctx, element);
    }

    if (currentTool === 'terrain' && terrainVertices.length > 0 && hoveredPoint) {
      drawTerrainPreview(
        ctx,
        terrainVertices,
        hoveredPoint,
        getTerrainElevationPreset(terrainElevationIndex),
      );
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

    if (marqueeRect && currentTool === 'select') {
      const { left, top, width, height } = normalizeSelectionRect(marqueeRect);
      ctx.save();
      ctx.fillStyle = 'rgba(184, 148, 31, 0.08)';
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([6, 4]);
      ctx.fillRect(left, top, width, height);
      ctx.strokeRect(left, top, width, height);
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (currentTool === 'vastu' && walls.length > 0) {
      drawVastuSectorOverlay(
        ctx,
        { walls, openings, labels, northOrientation },
        computeVastuOverlayRadius(walls),
      );
    }

    ctx.restore();

    if (currentTool === 'vastu' || northOrientation !== 0) {
      const center = { x: canvas.width - 72, y: 72 };
      const radius = 42;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(((northOrientation - 90) * Math.PI) / 180);
      ctx.strokeStyle = COMPASS_STROKE;
      ctx.fillStyle = COMPASS_FILL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, radius);
      ctx.moveTo(-radius, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();
      ctx.fillStyle = GOLD_MUTED;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', 0, -radius + 18);
      ctx.restore();
    }
  }, [canvasViewport, currentPoint, currentTool, dimensionStart, dimensionVisibility, dimensions, dragFurniturePosition, dragOpeningPosition, draggingFurnitureId, draggingOpeningId, fixtures, furniture, gridSize, gridVisible, hoveredOpening, hoveredPoint, hoveredWall, isDrawing, labels, landscapeElements, marqueeRect, mepSymbols, northOrientation, openings, previewOpening, roomWallSource, rooms, selectedFixtureId, selectedLabelId, selectedOpeningId, selectedWallId, selectedWallIds, snapEnabled, staircases, startPoint, terrain, terrainElevationIndex, terrainVertices, unitSystem, walls]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full touch-manipulation"
      style={{
        width: canvasMetrics.displayWidth,
        height: canvasMetrics.displayHeight,
        maxWidth: '100%',
      }}
    >
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
      <span className="rounded-md border border-primary/25 bg-background/90 px-2 py-1 text-[10px] font-mono text-foreground shadow-sm backdrop-blur-sm">
        {(canvasViewport.zoom * 100).toFixed(0)}%
      </span>
      {onResetViewport && canvasViewport.zoom !== 1 && (
        <button
          type="button"
          className="pointer-events-auto rounded-md border border-border bg-background/90 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground"
          onClick={onResetViewport}
        >
          Reset view
        </button>
      )}
    </div>
    {editingLabelId && (() => {
      const editingLabel = labels.find((l) => l.id === editingLabelId);
      const displayPos = editingLabel
        ? mapCanvasBufferToDisplay(
            mapWorldToCanvasBuffer(editingLabel.position, canvasViewport),
            canvasMetrics.bufferWidth,
            canvasMetrics.bufferHeight,
            canvasMetrics.displayWidth,
            canvasMetrics.displayHeight,
          )
        : { x: 0, y: 0 };
      return (
      <input
        ref={labelInputRef}
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
          left: displayPos.x,
          top: displayPos.y - 28,
        }}
        autoFocus
        aria-label="Edit label text"
      />
      );
    })()}
    <canvas
      ref={canvasRef}
      width={canvasMetrics.bufferWidth}
      height={canvasMetrics.bufferHeight}
      style={{
        width: canvasMetrics.displayWidth,
        height: canvasMetrics.displayHeight,
        maxWidth: '100%',
      }}
      className={`architect-canvas vish-canvas-tool-${currentTool} touch-none select-none rounded-lg shadow-md`}
      data-testid="blueprint-canvas"
      data-current-tool={currentTool}
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
