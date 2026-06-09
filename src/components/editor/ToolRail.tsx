// Tool rail — working drafting tools only
import {
  MousePointer2,
  Square,
  DoorOpen,
  SquareDashed,
  Type,
  Ruler,
  Compass,
  Sofa,
  Zap,
  TreePine,
  MoveHorizontal,
} from 'lucide-react';
import type { ToolType, WorkspaceMode } from '@/types';

interface ToolRailProps {
  currentTool: ToolType;
  workspaceMode?: WorkspaceMode;
  onToolChange: (tool: ToolType) => void;
}

type ToolEntry = {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  hint?: string;
};

const BASE_TOOLS: ToolEntry[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', hint: 'Select and inspect walls' },
  { id: 'wall', icon: Square, label: 'Wall', shortcut: 'W', hint: 'Tap start, tap end' },
  { id: 'door', icon: DoorOpen, label: 'Door', shortcut: 'D', hint: 'Tap a wall to place' },
  { id: 'window', icon: SquareDashed, label: 'Window', shortcut: 'N', hint: 'Tap a wall to place' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M', hint: 'Inspect dimensions' },
  { id: 'text', icon: Type, label: 'Label', shortcut: 'T', hint: 'Place room label' },
  { id: 'dimension', icon: MoveHorizontal, label: 'Dimension', shortcut: '⇧M', hint: 'Dimension line' },
];

const MODE_TOOLS: Record<WorkspaceMode, ToolEntry[]> = {
  draft: [
    { id: 'room', icon: Square, label: 'Room', hint: 'Detect / label rooms' },
    { id: 'vastu', icon: Compass, label: 'Vastu', hint: 'Harmony compass overlay' },
  ],
  mep: [{ id: 'mep', icon: Zap, label: 'MEP', hint: 'Place MEP symbols and lighting fixtures' }],
  interior: [{ id: 'furniture', icon: Sofa, label: 'Furniture', shortcut: 'F', hint: 'Place furniture' }],
  landscape: [{ id: 'landscape', icon: TreePine, label: 'Landscape', hint: 'Garden elements' }],
  walk: [],
};

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
  const hintText = hint ?? label;
  const titleText = shortcut ? `${label} (${shortcut}) — ${hintText}` : `${label} — ${hintText}`;

  return (
    <button
      type="button"
      className={`architect-tool-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title={titleText}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="font-technical text-[9px] leading-none tracking-[0.06em]">{label}</span>
      {shortcut && (
        <span className="font-technical text-[8px] leading-none opacity-55">{shortcut}</span>
      )}
    </button>
  );
}

export default function ToolRail({ currentTool, workspaceMode = 'draft', onToolChange }: ToolRailProps) {
  const modeTools = MODE_TOOLS[workspaceMode] ?? [];

  return (
    <div
      className="vish-tool-rail architect-tool-dock flex h-full shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
      style={{ width: 'var(--vish-tool-rail-width, 72px)' }}
      data-testid="tool-rail"
    >
      <p className="vish-tool-section-label px-1">Base</p>
      {BASE_TOOLS.map((tool) => (
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
      {modeTools.length > 0 && (
        <>
          <p className="vish-tool-section-label mt-2 px-1">Mode</p>
          {modeTools.map((tool) => (
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
        </>
      )}
    </div>
  );
}
