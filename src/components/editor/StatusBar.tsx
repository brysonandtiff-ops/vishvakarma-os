import { MousePointer2 } from 'lucide-react';
import type { ToolType } from '@/types';

export default function StatusBar({
  currentTool,
  wallCount,
  openingCount,
  mousePos,
  snapEnabled,
}: {
  currentTool: ToolType;
  wallCount: number;
  openingCount: number;
  mousePos: { x: number; y: number };
  snapEnabled: boolean;
}) {
  const toolHints: Record<ToolType, string> = {
    select: 'Select — tap to inspect, drag handles to adjust',
    wall: 'Wall — tap start, tap end. Snap joins corners.',
    door: 'Door — tap a wall to place a door.',
    window: 'Window — tap a wall to place a window.',
    measure: 'Measure — hover or tap walls to inspect dimensions.',
    text: 'Label — tap to place a room label.',
    dimension: 'Dimension — tap start point, then end point.',
  };

  return (
    <div className="ws-status-bar">
      <div className="ws-status-item active">
        <MousePointer2 className="h-2.5 w-2.5" />
        <span>{toolHints[currentTool]}</span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item">
        <span>X</span><span className="text-ws-text">{mousePos.x.toFixed(0)}</span>
        <span className="mx-0.5">·</span>
        <span>Y</span><span className="text-ws-text">{mousePos.y.toFixed(0)}</span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item">
        <span>Walls:</span><span className="text-ws-text">{wallCount}</span>
        <span className="mx-0.5">·</span>
        <span>Openings:</span><span className="text-ws-text">{openingCount}</span>
      </div>
      <div className="ws-status-divider" />
      <div className={`ws-status-item ${snapEnabled ? 'active' : ''}`}>
        <span>{snapEnabled ? '⊕ Snap ON' : '⊗ Snap OFF'}</span>
      </div>
      <div className="ml-auto ws-status-item">
        <span>Vishvakarma.OS v1.0.0</span>
      </div>
    </div>
  );
}
