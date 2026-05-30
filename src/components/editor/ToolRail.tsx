// Tool rail — mockup-grouped drafting palette
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2,
  Square,
  DoorOpen,
  SquareDashed,
  Type,
  Ruler,
  Circle,
  Waypoints,
  Layers,
  Box,
  MapPin,
  HardDrive,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { ToolType } from '@/types';

interface ToolRailProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

type ToolEntry = {
  id?: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
  stub?: boolean;
};

type ToolSection = {
  label: string;
  tools: ToolEntry[];
};

const toolSections: ToolSection[] = [
  {
    label: 'Select',
    tools: [{ id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', hint: 'Select and inspect walls' }],
  },
  {
    label: 'Structure',
    tools: [
      { id: 'wall', icon: Square, label: 'Wall', shortcut: 'W', hint: 'Tap start, tap end' },
      { icon: Circle, label: 'Arc', stub: true },
      { icon: Waypoints, label: 'Spline', stub: true },
      { id: 'door', icon: DoorOpen, label: 'Door', shortcut: 'D', hint: 'Tap a wall to place' },
      { id: 'window', icon: SquareDashed, label: 'Window', shortcut: 'N', hint: 'Tap a wall to place' },
      { icon: Layers, label: 'Stairs', stub: true },
      { icon: Box, label: 'Niche', stub: true },
    ],
  },
  {
    label: 'Annotate',
    tools: [
      { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M', hint: 'Inspect dimensions' },
      { id: 'text', icon: Type, label: 'Label', shortcut: 'T', hint: 'Place room label' },
      { id: 'dimension', icon: Ruler, label: 'Dim', shortcut: '⇧M', hint: 'Dimension line' },
    ],
  },
  {
    label: 'Schema',
    tools: [
      { icon: HardDrive, label: 'Misc', stub: true },
      { icon: MapPin, label: 'Site', stub: true },
      { icon: HardDrive, label: 'ROM', stub: true },
      { icon: Box, label: '3D', stub: true },
    ],
  },
  {
    label: 'Analysis',
    tools: [{ icon: Sparkles, label: 'Vastu', stub: true }],
  },
];

function ToolButton({
  icon: Icon,
  label,
  shortcut,
  hint,
  isActive,
  isStub,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
  isActive?: boolean;
  isStub?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`architect-tool-button ${isActive ? 'active' : ''} ${isStub ? 'stub' : ''}`}
          onClick={onClick}
          disabled={isStub}
          aria-label={label}
          aria-pressed={isActive}
          aria-disabled={isStub}
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
          <p className="text-[11px] text-muted-foreground">{isStub ? 'Coming soon' : hint}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ToolRail({ currentTool, onToolChange }: ToolRailProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="vish-tool-rail vish-tool-rail-mockup architect-tool-dock flex h-full w-[72px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
        data-testid="tool-rail"
      >
        {toolSections.map((section) => (
          <div key={section.label} className="w-full">
            <p className="vish-tool-section-label">{section.label}</p>
            {section.tools.map((tool) => (
              <ToolButton
                key={`${section.label}-${tool.label}`}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                hint={tool.hint}
                isStub={tool.stub}
                isActive={tool.id ? currentTool === tool.id : false}
                onClick={tool.id && !tool.stub ? () => onToolChange(tool.id!) : undefined}
              />
            ))}
          </div>
        ))}
        <div className="mt-auto flex w-full justify-center pb-1 pt-2">
          <ChevronDown className="h-3.5 w-3.5 text-ws-text-faint" aria-hidden="true" />
        </div>
      </div>
    </TooltipProvider>
  );
}
