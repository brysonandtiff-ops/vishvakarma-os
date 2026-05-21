import {
  AppWindow,
  Box,
  DoorOpen,
  FileDown,
  Grid3x3,
  Magnet,
  MousePointer2,
  Package,
  PenLine,
  Ruler,
} from 'lucide-react';
import type { ToolType } from '@/types';

interface EditorCommandStripProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  show3DView: boolean;
  onToggle3D: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onLoadSample: () => void;
  onExport: () => void;
  wallCount: number;
  openingCount: number;
}

const tools: Array<{ id: ToolType; label: string; icon: typeof MousePointer2; shortcut: string }> = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
  { id: 'wall', label: 'Wall', icon: PenLine, shortcut: 'W' },
  { id: 'door', label: 'Door', icon: DoorOpen, shortcut: 'D' },
  { id: 'window', label: 'Window', icon: AppWindow, shortcut: 'N' },
  { id: 'measure', label: 'Measure', icon: Ruler, shortcut: 'M' },
];

function StripButton({
  active,
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  active?: boolean;
  icon: typeof MousePointer2;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all ${
        active
          ? 'border-primary/70 bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'border-ws-border bg-ws-toolbar text-ws-text-dim hover:border-primary/45 hover:bg-ws-hover hover:text-ws-text'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      {shortcut && (
        <span className={`font-technical text-[9px] ${active ? 'text-primary-foreground/70' : 'text-ws-text-faint'}`}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

export default function EditorCommandStrip({
  currentTool,
  onSelectTool,
  show3DView,
  onToggle3D,
  gridVisible,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  onLoadSample,
  onExport,
  wallCount,
  openingCount,
}: EditorCommandStripProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ws-border bg-ws-menubar px-3 py-2">
      <div className="mr-1 flex items-center gap-1.5 rounded-xl border border-primary/25 bg-black/25 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--ws-active))]" />
        <span className="font-technical text-[10px] uppercase tracking-[0.2em] text-ws-text">Plan Mode</span>
        <span className="font-technical text-[10px] text-ws-text-faint">{wallCount} walls · {openingCount} openings</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tools.map((tool) => (
          <StripButton
            key={tool.id}
            active={currentTool === tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            onClick={() => onSelectTool(tool.id)}
          />
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <StripButton active={show3DView} icon={Box} label="3D" shortcut="3" onClick={onToggle3D} />
        <StripButton active={gridVisible} icon={Grid3x3} label="Grid" shortcut="G" onClick={onToggleGrid} />
        <StripButton active={snapEnabled} icon={Magnet} label="Snap" onClick={onToggleSnap} />
        <StripButton icon={Package} label="Sample" onClick={onLoadSample} />
        <StripButton icon={FileDown} label="Export" onClick={onExport} />
      </div>
    </div>
  );
}
