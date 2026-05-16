// Tool rail — professional workstation dark tool palette with grouped controls
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2,
  Square,
  DoorOpen,
  SquareDashed,
  Ruler,
  Grid3x3,
  Magnet,
  Box,
} from 'lucide-react';
import type { ToolType } from '@/types';

interface ToolRailProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  show3DView: boolean;
  onToggle3DView: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
}

const drawTools = [
  { id: 'select'  as ToolType, icon: MousePointer2, label: 'Select',  shortcut: 'V' },
  { id: 'wall'    as ToolType, icon: Square,         label: 'Wall',    shortcut: 'W' },
  { id: 'door'    as ToolType, icon: DoorOpen,       label: 'Door',    shortcut: 'D' },
  { id: 'window'  as ToolType, icon: SquareDashed,   label: 'Window',  shortcut: 'N' },
  { id: 'measure' as ToolType, icon: Ruler,           label: 'Measure', shortcut: 'M' },
];

function ToolButton({
  icon: Icon,
  label,
  shortcut,
  isActive,
  onClick,
  ariaLabel,
  ariaPressed,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
  ariaLabel: string;
  ariaPressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`architect-tool-button ${isActive ? 'active' : ''}`}
          onClick={onClick}
          aria-label={ariaLabel}
          aria-pressed={ariaPressed}
        >
          <Icon className="h-[16px] w-[16px]" />
          <span
            className="font-technical"
            style={{
              fontSize: '8px',
              letterSpacing: '0.04em',
              color: isActive ? 'hsl(var(--ws-active))' : 'hsl(var(--ws-text-faint))',
              lineHeight: 1,
            }}
          >
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="flex items-center gap-2">
        <span className="text-xs font-medium">{label}</span>
        {shortcut && (
          <kbd
            className="rounded px-1 py-0.5 font-mono text-[9px]"
            style={{
              background: 'hsl(var(--ws-border))',
              color: 'hsl(var(--ws-text-dim))',
              border: '1px solid hsl(var(--ws-border))',
            }}
          >
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ToolRail({
  currentTool,
  onToolChange,
  show3DView,
  onToggle3DView,
  gridVisible,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
}: ToolRailProps) {
  return (
    <TooltipProvider delayDuration={400}>
      <div
        className="architect-tool-dock flex h-full w-[60px] shrink-0 flex-col items-center gap-0.5 py-2"
        data-testid="tool-rail"
      >
        {/* DRAW group */}
        <p className="ws-tool-group-label w-full">Draw</p>
        {drawTools.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            isActive={currentTool === tool.id}
            onClick={() => onToolChange(tool.id)}
            ariaLabel={tool.label}
            ariaPressed={currentTool === tool.id}
          />
        ))}

        {/* Divider */}
        <div
          className="my-2 w-8 shrink-0 rounded-full"
          style={{ height: '1px', background: 'hsl(var(--ws-border-subtle))' }}
          data-testid="tool-separator"
        />

        {/* VIEW group */}
        <p className="ws-tool-group-label w-full">View</p>

        <ToolButton
          icon={Box}
          label="3D"
          shortcut="3"
          isActive={show3DView}
          onClick={onToggle3DView}
          ariaLabel="Toggle 3D View"
          ariaPressed={show3DView}
        />
        <ToolButton
          icon={Grid3x3}
          label="Grid"
          shortcut="G"
          isActive={gridVisible}
          onClick={onToggleGrid}
          ariaLabel="Toggle Grid"
          ariaPressed={gridVisible}
        />
        <ToolButton
          icon={Magnet}
          label="Snap"
          isActive={snapEnabled}
          onClick={onToggleSnap}
          ariaLabel="Snap to Grid"
          ariaPressed={snapEnabled}
        />
      </div>
    </TooltipProvider>
  );
}
