import {
  Compass,
  DoorOpen,
  Magnet,
  MousePointer2,
  PenLine,
  Ruler,
  Sofa,
  Square,
  SquareDashed,
  TreePine,
  Type,
  Zap,
  MoveHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';
import { APP_VERSION } from '@/config/appVersion';
import type { ToolType } from '@/types';

const TOOL_ICONS: Record<ToolType, typeof MousePointer2> = {
  select: MousePointer2,
  wall: PenLine,
  door: DoorOpen,
  window: SquareDashed,
  measure: Ruler,
  text: Type,
  dimension: MoveHorizontal,
  room: Square,
  vastu: Compass,
  mep: Zap,
  furniture: Sofa,
  landscape: TreePine,
};

export default function StatusBar({
  currentTool,
  wallCount,
  openingCount,
  mousePos,
  snapEnabled,
  dimensionVisibility,
  onToggleDimensions,
}: {
  currentTool: ToolType;
  wallCount: number;
  openingCount: number;
  mousePos: { x: number; y: number };
  snapEnabled: boolean;
  dimensionVisibility: boolean;
  onToggleDimensions: () => void;
}) {
  const toolHints: Record<ToolType, string> = {
    select: 'Select — tap to inspect, drag handles to adjust',
    wall: 'Wall — tap start, tap end. Snap joins corners.',
    door: 'Door — tap a wall to place a door.',
    window: 'Window — tap a wall to place a window.',
    measure: 'Measure — hover or tap walls to inspect dimensions.',
    text: 'Label — tap to place a room label.',
    dimension: 'Dimension — tap start point, then end point.',
    room: 'Room — tap enclosed area to detect and label rooms.',
    vastu: 'Vastu — harmony compass overlay; adjust north in sidebar.',
    mep: 'MEP — tap canvas to cycle MEP symbols and lighting fixtures.',
    furniture: 'Furniture — tap canvas to place furniture.',
    landscape: 'Landscape — tap canvas to place garden elements.',
  };

  const ToolIcon = TOOL_ICONS[currentTool] ?? MousePointer2;
  const hint = toolHints[currentTool];

  return (
    <div className="ws-status-bar">
      <div className="ws-status-item active min-w-0 max-w-[min(28rem,42vw)]">
        <ToolIcon className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate" title={hint}>
          {hint}
        </span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item shrink-0">
        <span>X</span><span className="text-ws-text">{mousePos.x.toFixed(0)}</span>
        <span className="mx-0.5">·</span>
        <span>Y</span><span className="text-ws-text">{mousePos.y.toFixed(0)}</span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item shrink-0">
        <span>Walls:</span><span className="text-ws-text">{wallCount}</span>
        <span className="mx-0.5">·</span>
        <span>Openings:</span><span className="text-ws-text">{openingCount}</span>
      </div>
      <div className="ws-status-divider" />
      <div className={`ws-status-item shrink-0 ${snapEnabled ? 'active' : ''}`}>
        <Magnet className="h-3 w-3" aria-hidden />
        <span>{snapEnabled ? 'Snap ON' : 'Snap OFF'}</span>
      </div>
      <div className="ws-status-divider" />
      <button
        type="button"
        className={`ws-status-item touch-target shrink-0 ${dimensionVisibility ? 'active' : ''}`}
        onClick={onToggleDimensions}
        title="Toggle dimension lines (⇧D)"
        aria-pressed={dimensionVisibility}
      >
        {dimensionVisibility ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        <span>{dimensionVisibility ? 'Dims ON' : 'Dims OFF'}</span>
      </button>
      <div className="ml-auto ws-status-item shrink-0">
        <span className="font-devanagari hidden text-[9px] text-primary/60 md:inline">ॐ शिल्प · </span>
        <span>Vishvakarma.OS {APP_VERSION}</span>
      </div>
    </div>
  );
}
