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
  onPress,
}: {
  toolId: ToolType;
  isActive?: boolean;
  onPress?: () => void;
}) {
  const meta = TOOL_META[toolId];
  const Icon = meta.icon;
  const titleText = meta.shortcut
    ? `${meta.label} (${meta.shortcut}) — ${meta.hint}`
    : `${meta.label} — ${meta.hint}`;
  const pressHandlers = useReliablePress(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    onPress?.();
  });

  return (
    <button
      type="button"
      className={`touch-target touch-manipulation flex flex-col items-center justify-center gap-1 min-h-[52px] min-w-[52px] rounded-[10px] transition-all duration-200 ${isActive ? 'active ' : ''}${
        isActive
          ? 'bg-vish-blue-500 text-white shadow-[0_0_15px_rgba(42,167,255,0.4)] relative before:absolute before:inset-0 before:rounded-[10px] before:border before:border-vish-gold-500/50 before:pointer-events-none'
          : 'text-vish-text-400 hover:text-white hover:bg-vish-navy-700/50'
      }`}
      aria-label={meta.label}
      aria-pressed={isActive}
      title={titleText}
      data-tutorial={`tool-${toolId}`}
      {...pressHandlers}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="font-semibold text-[8px] uppercase tracking-widest leading-none">{meta.label}</span>
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
      className="vish-tool-rail flex flex-col items-center gap-2 p-2 rounded-[12px] bg-[rgba(6,18,33,0.8)] backdrop-blur-xl border border-vish-navy-600/50 shadow-lg h-full overflow-y-auto shrink-0 z-10 mx-1.5 my-1.5 w-[68px]"
      data-testid="tool-rail"
      data-tutorial="tool-rail"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-vish-text-500 my-1">Base</p>
      {BASE_TOOL_IDS.map((toolId) => (
        <ToolButton
          key={toolId}
          toolId={toolId}
          isActive={currentTool === toolId}
          onPress={() => handleToolChange(toolId)}
        />
      ))}
      {modeToolIds.length > 0 && (
        <>
          <div className="w-8 h-px bg-vish-navy-600/50 my-1" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-vish-text-500 my-1">{MODE_LABELS[workspaceMode]}</p>
          {modeToolIds.map((toolId) => (
            <ToolButton
              key={toolId}
              toolId={toolId}
              isActive={currentTool === toolId}
              onPress={() => handleToolChange(toolId)}
            />
          ))}
        </>
      )}
      {powerToolIds.length > 0 && (
        <>
          <div className="w-8 h-px bg-vish-navy-600/50 my-1" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-vish-text-500 my-1">Power</p>
          {powerToolIds.map((toolId) => (
            <ToolButton
              key={toolId}
              toolId={toolId}
              isActive={currentTool === toolId}
              onPress={() => handleToolChange(toolId)}
            />
          ))}
        </>
      )}
    </div>
  );
});
