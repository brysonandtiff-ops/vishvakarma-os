import {
  Box,
  Download,
  FileDown,
  Grid3x3,
  Leaf,
  Menu,
  MoreHorizontal,
  PenLine,
  Plus,
  Redo2,
  Route,
  Sofa,
  Undo2,
  Wind,
  Eye,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { WorkspaceMode } from '@/types';

interface EditorTopBarProps {
  projectName: string;
  show3DView: boolean;
  workspaceMode: WorkspaceMode;
  zenMode?: boolean;
  presentationLock?: boolean;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onToggleZen?: () => void;
  onTogglePresentationLock?: () => void;
  onToggle3D: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onNewProject: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenEditorMenu?: () => void;
  onOpenGovernance?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const MODES: Array<{ id: WorkspaceMode; label: string; icon: typeof PenLine }> = [
  { id: 'draft', label: 'Draft', icon: PenLine },
  { id: 'mep', label: 'MEP', icon: Route },
  { id: 'interior', label: 'Interior', icon: Sofa },
  { id: 'landscape', label: 'Landscape', icon: Leaf },
  { id: 'walk', label: 'Walk', icon: Wind },
];

function IconButton({
  label,
  onClick,
  active,
  children,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`vish-editor-icon-btn touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-transparent text-ws-text-dim hover:border-ws-border hover:bg-ws-hover hover:text-ws-text'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

function ModeSwitcher({
  workspaceMode,
  onWorkspaceModeChange,
}: {
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
}) {
  const activeMode = MODES.find((m) => m.id === workspaceMode) ?? MODES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="vish-editor-mode-badge ml-1 inline-flex min-h-[44px] items-center gap-1 rounded-full border border-ws-border bg-ws-toolbar/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ws-text-dim hover:border-primary/40 hover:text-ws-text"
          aria-label={`Workspace mode: ${activeMode.label}. Tap to change mode.`}
        >
          <activeMode.icon className="h-3 w-3" />
          {activeMode.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-2" sideOffset={8}>
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace mode</p>
        <div className="flex flex-col gap-1">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-left text-sm ${
                workspaceMode === mode.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => onWorkspaceModeChange(mode.id)}
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function EditorTopBar({
  projectName,
  show3DView,
  workspaceMode,
  zenMode = false,
  presentationLock = false,
  onWorkspaceModeChange,
  onToggleZen,
  onTogglePresentationLock,
  onToggle3D,
  gridVisible,
  onToggleGrid,
  onNewProject,
  onExport,
  onImport,
  onOpenEditorMenu,
  onOpenGovernance,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: EditorTopBarProps) {
  return (
    <header
      className="vish-editor-topbar vish-editor-topbar-grid shrink-0"
      data-testid="editor-top-bar"
    >
      <div className="flex min-w-0 items-center gap-2 justify-self-start">
        {onOpenEditorMenu && (
          <IconButton label="Open editor menu" onClick={onOpenEditorMenu}>
            <Menu className="h-4 w-4" />
          </IconButton>
        )}
        <div className="vish-logo-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1">
          <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS logo" className="h-full w-full rounded-lg object-cover" />
        </div>
        <span className="max-w-[min(12rem,28vw)] truncate text-sm font-semibold text-ws-text">{projectName}</span>
        <ModeSwitcher workspaceMode={workspaceMode} onWorkspaceModeChange={onWorkspaceModeChange} />
      </div>

      <div className="vish-editor-topbar-center min-w-0 justify-self-center px-1">
        <div className="vish-mode-tab-group max-w-full overflow-x-auto" role="tablist" aria-label="Editor modes">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={workspaceMode === mode.id}
              className={`vish-mode-tab shrink-0 ${workspaceMode === mode.id ? 'active' : ''}`}
              onClick={() => onWorkspaceModeChange(mode.id)}
            >
              <mode.icon className="h-3 w-3" />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1 justify-self-end">
        <IconButton label="Undo" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Redo" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="New project" onClick={onNewProject}>
          <Plus className="h-4 w-4" />
        </IconButton>
        <IconButton label="Import floor plan" onClick={onImport}>
          <Download className="h-4 w-4" />
        </IconButton>
        <IconButton label="Export floor plan" onClick={onExport}>
          <FileDown className="h-4 w-4" />
        </IconButton>
        <IconButton label="Toggle 3D view" active={show3DView} onClick={onToggle3D}>
          <Box className="h-4 w-4" />
        </IconButton>
        <IconButton label="Toggle grid" active={gridVisible} onClick={onToggleGrid}>
          <Grid3x3 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Zen mode" active={zenMode} onClick={() => onToggleZen?.()}>
          <Eye className="h-4 w-4" />
        </IconButton>
        <IconButton label="Presentation lock" active={presentationLock} onClick={() => onTogglePresentationLock?.()}>
          <Lock className="h-4 w-4" />
        </IconButton>
        {onOpenGovernance && (
          <IconButton label="Open navigation" onClick={onOpenGovernance}>
            <MoreHorizontal className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    </header>
  );
}
