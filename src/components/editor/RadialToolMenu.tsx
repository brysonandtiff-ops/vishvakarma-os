import { DoorOpen, MousePointer2, Ruler, Square } from 'lucide-react';
import type { ToolType } from '@/types';

interface RadialToolMenuProps {
  visible: boolean;
  x: number;
  y: number;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

const radialTools: Array<{ id: ToolType; label: string; icon: typeof Square }> = [
  { id: 'wall', label: 'Wall', icon: Square },
  { id: 'door', label: 'Door', icon: DoorOpen },
  { id: 'window', label: 'Window', icon: Square },
  { id: 'measure', label: 'Measure', icon: Ruler },
];

export default function RadialToolMenu({ visible, x, y, currentTool, onSelectTool }: RadialToolMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      data-testid="radial-tool-menu"
    >
      <div className="relative h-28 w-28">
        <div className="pointer-events-auto absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-ws-menubar text-primary shadow-lg">
          <MousePointer2 className="h-4 w-4" />
        </div>
        {radialTools.map((tool, index) => {
          const angle = (index / radialTools.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 44;
          const left = 56 + Math.cos(angle) * radius;
          const top = 56 + Math.sin(angle) * radius;
          const Icon = tool.icon;
          const active = currentTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              aria-label={tool.label}
              aria-pressed={active}
              className={`pointer-events-auto absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-wide ${
                active
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-ws-border bg-ws-menubar text-ws-text-dim hover:border-primary/40 hover:text-ws-text'
              }`}
              style={{ left, top }}
              onClick={() => onSelectTool(tool.id)}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
