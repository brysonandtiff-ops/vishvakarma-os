// Tool rail — working drafting tools only
import type { ToolType, WorkspaceMode } from '@/types';
import { BASE_TOOL_IDS, TOOL_META } from '@/editor/toolMeta';

interface ToolRailProps {
  currentTool: ToolType;
  workspaceMode?: WorkspaceMode;
  onToolChange: (tool: ToolType) => void;
}

const MODE_TOOL_IDS: Record<WorkspaceMode, ToolType[]> = {
  draft: ['room', 'vastu'],
  mep: ['mep'],
  interior: ['furniture'],
  landscape: ['landscape', 'terrain'],
  walk: [],
};

const MODE_LABELS: Record<WorkspaceMode, string> = {
  draft: 'Draft',
  mep: 'MEP',
  interior: 'Interior',
  landscape: 'Landscape',
  walk: 'Walk',
};

function ToolButton({
  toolId,
  isActive,
  onClick,
}: {
  toolId: ToolType;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const meta = TOOL_META[toolId];
  const Icon = meta.icon;
  const titleText = meta.shortcut
    ? `${meta.label} (${meta.shortcut}) — ${meta.hint}`
    : `${meta.label} — ${meta.hint}`;

  return (
    <button
      type="button"
      className={`architect-tool-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={meta.label}
      aria-pressed={isActive}
      title={titleText}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="font-technical text-[9px] leading-none tracking-[0.06em]">{meta.label}</span>
      {meta.shortcut && (
        <span className="font-technical text-[8px] leading-none opacity-55">{meta.shortcut}</span>
      )}
    </button>
  );
}

export default function ToolRail({ currentTool, workspaceMode = 'draft', onToolChange }: ToolRailProps) {
  const modeToolIds = MODE_TOOL_IDS[workspaceMode] ?? [];

  return (
    <div
      className="vish-tool-rail architect-tool-dock flex h-full shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
      data-testid="tool-rail"
    >
      <p className="vish-tool-section-label px-1">Base</p>
      {BASE_TOOL_IDS.map((toolId) => (
        <ToolButton
          key={toolId}
          toolId={toolId}
          isActive={currentTool === toolId}
          onClick={() => onToolChange(toolId)}
        />
      ))}
      {modeToolIds.length > 0 && (
        <>
          <p className="vish-tool-section-label mt-2 px-1">{MODE_LABELS[workspaceMode]}</p>
          {modeToolIds.map((toolId) => (
            <ToolButton
              key={toolId}
              toolId={toolId}
              isActive={currentTool === toolId}
              onClick={() => onToolChange(toolId)}
            />
          ))}
        </>
      )}
    </div>
  );
}
