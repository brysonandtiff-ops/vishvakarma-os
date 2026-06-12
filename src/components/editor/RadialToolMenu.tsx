import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { MousePointer2 } from 'lucide-react';
import { RADIAL_TOOL_IDS, TOOL_META } from '@/editor/toolMeta';
import type { ToolType } from '@/types';

interface RadialToolMenuProps {
  visible: boolean;
  x: number;
  y: number;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

export default function RadialToolMenu({ visible, x, y, currentTool, onSelectTool }: RadialToolMenuProps) {
  const isCoarsePointer = useCoarsePointer();

  if (!visible || isCoarsePointer) return null;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      data-testid="radial-tool-menu"
    >
      <div className="relative h-28 w-28">
        <button
          type="button"
          aria-label="Select"
          className="vish-radial-center-btn pointer-events-auto absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-ws-menubar text-primary shadow-lg"
          onClick={() => onSelectTool('select')}
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        {RADIAL_TOOL_IDS.map((toolId, index) => {
          const angle = (index / RADIAL_TOOL_IDS.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 44;
          const left = 56 + Math.cos(angle) * radius;
          const top = 56 + Math.sin(angle) * radius;
          const meta = TOOL_META[toolId];
          const Icon = meta.icon;
          const active = currentTool === toolId;

          return (
            <button
              key={toolId}
              type="button"
              aria-label={meta.label}
              aria-pressed={active}
              className={`vish-radial-tool-btn pointer-events-auto absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-wide ${
                active
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-ws-border bg-ws-menubar text-ws-text-dim hover:border-primary/40 hover:text-ws-text'
              }`}
              style={{ left, top }}
              onClick={() => onSelectTool(toolId)}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
