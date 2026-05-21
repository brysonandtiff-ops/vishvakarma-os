// Tool rail — iPad-first professional drafting palette with grouped controls
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
  { id: 'select'  as ToolType, icon: MousePointer2, label: 'Select',  shortcut: 'V', hint: 'Select and inspect walls' },
  { id: 'wall'    as ToolType, icon: Square,         label: 'Wall',    shortcut: 'W', hint: 'Tap start, tap end' },
  { id: 'door'    as ToolType, icon: DoorOpen,       label: 'Door',    shortcut: 'D', hint: 'Tap a wall to place' },
  { id: 'window'  as ToolType, icon: SquareDashed,   label: 'Window',  shortcut: 'N', hint: 'Tap a wall to place' },
  { id: 'measure' as ToolType, icon: Ruler,           label: 'Measure', shortcut: 'M', hint: 'Inspect dimensions' },
];

function ToolButton({
  icon: Icon,
  label,
  shortcut,
  hint,
  isActive,
  onClick,
  ariaLabel,
  ariaPressed,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
  isActive?: boolean;
  onClick: () => void;
  ariaLabel: string;
  ariaPressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`architect-tool-button ${isActive ? 'active' : ''}`}
          onClick={onClick}
          aria-label={ariaLabel}
          aria-pressed={ariaPressed}
        >
          <Icon className="h-[18px] w-[18px]" />
          <span className="font-technical text-[8px] leading-none tracking-[0.06em]">
            {label}
          </span>
          {shortcut && (
            <span className="font-technical text-[7px] leading-none opacity-55">
              {shortcut}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="max-w-56">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{label}</span>
            {shortcut && (
              <kbd className="rounded border px-1 py-0.5 font-mono text-[9px]">
                {shortcut}
              </kbd>
            )}
          </div>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
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
    <TooltipProvider delayDuration={250}>
      <div
        className="architect-tool-dock flex h-full w-[72px] shrink-0 flex-col items-center gap-1 py-2"
        data-testid="tool-rail"
      >
        <p className="ws-tool-group-label w-full">Draw</p>
        {drawTools.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            hint={tool.hint}
            isActive={currentTool === tool.id}
            onClick={() => onToolChange(tool.id)}
            ariaLabel={tool.label}
            ariaPressed={currentTool === tool.id}
          />
        ))}

        <div
          className="my-2 w-10 shrink-0 rounded-full"
          style={{ height: '1px', background: 'hsl(var(--ws-border-subtle))' }}
          data-testid="tool-separator"
        />

        <p className="ws-tool-group-label w-full">View</p>

        <ToolButton
          icon={Box}
          label="3D"
          shortcut="3"
          hint="Show or hide live 3D preview"
          isActive={show3DView}
          onClick={onToggle3DView}
          ariaLabel="Toggle 3D View"
          ariaPressed={show3DView}
        />
        <ToolButton
          icon={Grid3x3}
          label="Grid"
          shortcut="G"
          hint="Show or hide drafting grid"
          isActive={gridVisible}
          onClick={onToggleGrid}
          ariaLabel="Toggle Grid"
          ariaPressed={gridVisible}
        />
        <ToolButton
          icon={Magnet}
          label="Snap"
          hint="Snap walls to grid and endpoints"
          isActive={snapEnabled}
          onClick={onToggleSnap}
          ariaLabel="Snap to Grid"
          ariaPressed={snapEnabled}
        />
      </div>
    </TooltipProvider>
  );
}
