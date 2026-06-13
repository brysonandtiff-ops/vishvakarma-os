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

  const outerRadius = RADIAL_TOOL_IDS.length > 6 ? 52 : 44;
  const menuSize = outerRadius * 2 + 24;

  return (
    <div
      className="pointer-events-none absolute z-20 vish-radial-menu"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      data-testid="radial-tool-menu"
      role="toolbar"
      aria-label="Radial tool picker"
    >
      <div className="relative" style={{ width: menuSize, height: menuSize }}>
        <button
          type="button"
          aria-label="Select"
          title="Select (V)"
          className="vish-radial-center-btn pointer-events-auto absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-ws-menubar text-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          onClick={() => onSelectTool('select')}
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        {RADIAL_TOOL_IDS.map((toolId, index) => {
          const angle = (index / RADIAL_TOOL_IDS.length) * Math.PI * 2 - Math.PI / 2;
          const left = menuSize / 2 + Math.cos(angle) * outerRadius;
          const top = menuSize / 2 + Math.sin(angle) * outerRadius;
          const meta = TOOL_META[toolId];
          const Icon = meta.icon;
          const active = currentTool === toolId;
          const title = meta.shortcut
            ? `${meta.label} (${meta.shortcut})`
            : meta.label;

          return (
            <button
              key={toolId}
              type="button"
              aria-label={meta.label}
              aria-pressed={active}
              title={title}
              className={`vish-radial-tool-btn pointer-events-auto absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                active
                  ? 'border-primary bg-primary/20 text-primary vish-radial-tool-btn--active'
                  : 'border-ws-border bg-ws-menubar text-ws-text-dim hover:border-primary/40 hover:text-ws-text'
              }`}
              style={{
                left,
                top,
                animationDelay: `${index * 35}ms`,
              }}
              onClick={() => onSelectTool(toolId)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
