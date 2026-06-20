import { Eye, EyeOff, Magnet, Minus, Plus } from 'lucide-react';
import { APP_VERSION } from '@/config/appVersion';
import { resolveEditorMantraChip } from '@/editor/editorMantras';
import { STATUS_TOOL_HINTS, TOUCH_STATUS_HINTS, TOOL_META } from '@/editor/toolMeta';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import type { ToolType, WorkspaceMode } from '@/types';
import EditorMantraToggle from '@/components/editor/EditorMantraToggle';

export default function StatusBar({
  currentTool,
  workspaceMode = 'draft',
  wallCount,
  openingCount,
  mousePos,
  snapEnabled,
  dimensionVisibility,
  canvasZoom,
  onToggleDimensions,
  onResetViewport,
  onZoomIn,
  onZoomOut,
}: {
  currentTool: ToolType;
  workspaceMode?: WorkspaceMode;
  wallCount: number;
  openingCount: number;
  mousePos: { x: number; y: number };
  snapEnabled: boolean;
  dimensionVisibility: boolean;
  canvasZoom?: number;
  onToggleDimensions: () => void;
  onResetViewport?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}) {
  const isCoarsePointer = useCoarsePointer();
  const meta = TOOL_META[currentTool];
  const ToolIcon = meta?.icon;
  const hint = isCoarsePointer ? TOUCH_STATUS_HINTS[currentTool] : STATUS_TOOL_HINTS[currentTool];
  const mantraChip = resolveEditorMantraChip(workspaceMode);
  const showTouchZoom = isCoarsePointer && onZoomIn && onZoomOut;

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
      {canvasZoom !== undefined && (
        <>
          <div className="ws-status-item shrink-0">
            <span>Zoom</span>
            <span className="text-ws-text">{Math.round(canvasZoom * 100)}%</span>
          </div>
          {showTouchZoom && (
            <button
              type="button"
              className="ws-status-item touch-target shrink-0"
              onClick={onZoomOut}
              aria-label="Zoom out"
            >
              <Minus className="h-3 w-3" aria-hidden />
            </button>
          )}
          {showTouchZoom && (
            <button
              type="button"
              className="ws-status-item touch-target shrink-0"
              onClick={onZoomIn}
              aria-label="Zoom in"
            >
              <Plus className="h-3 w-3" aria-hidden />
            </button>
          )}
          <div className="ws-status-divider" />
        </>
      )}
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
      <div className="ml-auto flex items-center gap-2">
        {isCoarsePointer && <EditorMantraToggle />}
        {onResetViewport && canvasZoom !== undefined && canvasZoom !== 1 && (
          <button
            type="button"
            className="ws-status-item touch-target shrink-0 hover:text-ws-text"
            onClick={onResetViewport}
            title="Reset canvas view"
          >
            Reset view
          </button>
        )}
        <div className="ws-status-item shrink-0">
          <span className="font-devanagari hidden text-[9px] text-primary/60 md:inline">{mantraChip} · </span>
          <span>Vishvakarma.OS {APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
