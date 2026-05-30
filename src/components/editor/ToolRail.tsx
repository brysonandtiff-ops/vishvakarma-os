// Tool rail — working drafting tools only
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2,
  Square,
  DoorOpen,
  SquareDashed,
  Type,
  Ruler,
} from 'lucide-react';
import type { ToolType } from '@/types';

interface ToolRailProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

type ToolEntry = {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
};

const WORKING_TOOLS: ToolEntry[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', hint: 'Select and inspect walls' },
  { id: 'wall', icon: Square, label: 'Wall', shortcut: 'W', hint: 'Tap start, tap end' },
  { id: 'door', icon: DoorOpen, label: 'Door', shortcut: 'D', hint: 'Tap a wall to place' },
  { id: 'window', icon: SquareDashed, label: 'Window', shortcut: 'N', hint: 'Tap a wall to place' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M', hint: 'Inspect dimensions' },
  { id: 'text', icon: Type, label: 'Label', shortcut: 'T', hint: 'Place room label' },
  { id: 'dimension', icon: Ruler, label: 'Dimension', shortcut: '⇧M', hint: 'Dimension line' },
];

function ToolButton({
  icon: Icon,
  label,
  shortcut,
  hint,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`architect-tool-button ${isActive ? 'active' : ''}`}
          onClick={onClick}
          aria-label={label}
          aria-pressed={isActive}
        >
          <Icon className="h-[18px] w-[18px]" />
          <span className="font-technical text-[8px] leading-none tracking-[0.06em]">{label}</span>
          {shortcut && (
            <span className="font-technical text-[7px] leading-none opacity-55">{shortcut}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="max-w-56">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{label}</span>
            {shortcut && (
              <kbd className="rounded border px-1 py-0.5 font-mono text-[9px]">{shortcut}</kbd>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ToolRail({ currentTool, onToolChange }: ToolRailProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="vish-tool-rail architect-tool-dock flex h-full w-[72px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
        data-testid="tool-rail"
      >
        {WORKING_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            hint={tool.hint}
            isActive={currentTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
