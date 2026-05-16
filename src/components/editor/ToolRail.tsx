// Tool rail component for blueprint editor — premium graphite command rail
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2,
  Square,
  DoorOpen,
  SquareDashed,
  Ruler,
  Grid3x3,
  Magnet,
  Eye,
  EyeOff,
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

const tools = [
  { id: 'select' as ToolType, icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'wall' as ToolType, icon: Square, label: 'Wall', shortcut: 'W' },
  { id: 'door' as ToolType, icon: DoorOpen, label: 'Door', shortcut: 'D' },
  { id: 'window' as ToolType, icon: SquareDashed, label: 'Window', shortcut: 'N' },
  { id: 'measure' as ToolType, icon: Ruler, label: 'Measure', shortcut: 'M' },
];

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
    <TooltipProvider delayDuration={300}>
      <div className="architect-tool-dock flex h-full w-[60px] shrink-0 flex-col items-center gap-1 py-3">
        {/* Section label */}
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
          Tools
        </p>

        {/* Drawing Tools */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  className={`architect-tool-button ${isActive ? 'active' : ''}`}
                  onClick={() => onToolChange(tool.id)}
                  aria-label={`${tool.label} (${tool.shortcut})`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="flex items-center gap-2 text-sm">
                  {tool.label}
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {tool.shortcut}
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator className="my-2 w-8 bg-sidebar-border" />

        {/* Section label */}
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
          View
        </p>

        {/* View Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`architect-tool-button ${show3DView ? 'active' : ''}`}
              onClick={onToggle3DView}
              aria-label="Toggle 3D View"
              aria-pressed={show3DView}
            >
              {show3DView ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="flex items-center gap-2 text-sm">
              3D View
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">3</kbd>
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`architect-tool-button ${gridVisible ? 'active' : ''}`}
              onClick={onToggleGrid}
              aria-label="Toggle Grid"
              aria-pressed={gridVisible}
            >
              <Grid3x3 className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="flex items-center gap-2 text-sm">
              Grid
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">G</kbd>
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`architect-tool-button ${snapEnabled ? 'active' : ''}`}
              onClick={onToggleSnap}
              aria-label="Snap to Grid"
              aria-pressed={snapEnabled}
            >
              <Magnet className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="text-sm">Snap to Grid</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
