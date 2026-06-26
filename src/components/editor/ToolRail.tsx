import { memo, useCallback } from 'react';
import type { ToolType, WorkspaceMode } from '@/types';
import { BASE_TOOL_IDS, TOOL_META } from '@/editor/toolMeta';
import { useReliablePress } from '@/hooks/useReliablePress';
import { playStudioSound } from '@/modules/studio-audio/audioEngine';

interface ToolRailProps {
  currentTool: ToolType;
  workspaceMode?: WorkspaceMode;
  onToolChange: (tool: ToolType) => void;
}

const MODE_TOOL_IDS: Record<WorkspaceMode, ToolType[]> = {
  draft: ['room', 'vastu', 'column', 'stair'],
  mep: ['mep'],
  interior: ['furniture'],
  landscape: ['landscape', 'terrain'],
  walk: [],
};

const POWER_TOOL_IDS: ToolType[] = ['room', 'column', 'stair', 'vastu', 'mep', 'furniture', 'landscape', 'terrain'];

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
      className={`architect-tool-button vish-pressable min-h-[44px] min-w-[44px] prana-glow ${isActive ? 'active' : ''}`}
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(50);
        onClick?.();
      }}
      aria-label={meta.label}
      aria-pressed={isActive}
      title={titleText}
      data-tutorial={`tool-${toolId}`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="font-technical w-full truncate px-0.5 text-center text-[8px] leading-[1.15] tracking-[0.02em]">{meta.label}</span>
      {meta.shortcut && (
        <span className="font-technical text-[8px] leading-none opacity-55">{meta.shortcut}</span>
      )}
    </button>
  );
}

export default memo(function ToolRail({ currentTool, workspaceMode = 'draft', onToolChange }: ToolRailProps) {
  const modeToolIds = MODE_TOOL_IDS[workspaceMode] ?? [];
  const visibleBaseAndMode = new Set<ToolType>([...BASE_TOOL_IDS, ...modeToolIds]);
  const powerToolIds = POWER_TOOL_IDS.filter((toolId) => !visibleBaseAndMode.has(toolId));

  const handleToolChange = useCallback(
    (tool: ToolType) => {
      if (tool !== currentTool) playStudioSound('toolSelect');
      onToolChange(tool);
    },
    [currentTool, onToolChange],
  );

  return (
    <div
      className="vish-tool-rail vish-tool-dock architect-tool-dock vish-stagger-children glass-panel-obsidian laser-etched-border flex h-full shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
      data-testid="tool-rail"
      data-tutorial="tool-rail"
    >
      <p className="vish-tool-section-label px-1">Base</p>
      {BASE_TOOL_IDS.map((toolId) => (
        <ToolButton
          key={toolId}
          toolId={toolId}
          isActive={currentTool === toolId}
          onClick={() => handleToolChange(toolId)}
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
              onClick={() => handleToolChange(toolId)}
            />
          ))}
        </>
      )}
      {powerToolIds.length > 0 && (
        <>
          <p className="vish-tool-section-label mt-2 px-1">Power</p>
          {powerToolIds.map((toolId) => (
            <ToolButton
              key={toolId}
              toolId={toolId}
              isActive={currentTool === toolId}
              onClick={() => handleToolChange(toolId)}
            />
          ))}
        </>
      )}
    </div>
  );
});
