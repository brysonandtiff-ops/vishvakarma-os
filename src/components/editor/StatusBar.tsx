import { Eye, EyeOff, Magnet } from 'lucide-react';
import { APP_VERSION } from '@/config/appVersion';
import { STATUS_TOOL_HINTS, TOOL_META } from '@/editor/toolMeta';
import type { ToolType } from '@/types';

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
  const meta = TOOL_META[currentTool];
  const ToolIcon = meta?.icon;
  const hint = STATUS_TOOL_HINTS[currentTool];

  return (
    <div className="ws-status-bar">
      <div className="ws-status-item active min-w-0 max-w-[min(28rem,42vw)]">
        {ToolIcon && <ToolIcon className="h-3 w-3 shrink-0" aria-hidden />}
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
