import {
  Box,
  Download,
  FileDown,
  FileUp,
  Grid3x3,
  Menu,
  MoreHorizontal,
  PenLine,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { toast } from 'sonner';

type EditorMode = 'draft';

interface EditorTopBarProps {
  projectName: string;
  show3DView: boolean;
  onToggle3D: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onNewProject: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenGovernance?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const MODES: Array<{ id: EditorMode; label: string; icon?: typeof PenLine }> = [
  { id: 'draft', label: 'Draft', icon: PenLine },
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
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-transparent text-ws-text-dim hover:border-ws-border hover:bg-ws-hover hover:text-ws-text'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

export default function EditorTopBar({
  projectName,
  show3DView,
  onToggle3D,
  gridVisible,
  onToggleGrid,
  onNewProject,
  onExport,
  onImport,
  onOpenGovernance,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: EditorTopBarProps) {
  const showStub = () => toast.message('Coming soon', { description: 'This control is not available in the current release.' });

  return (
    <header className="vish-editor-topbar shrink-0" data-testid="editor-top-bar">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenGovernance && (
          <IconButton label="Open governance navigation" onClick={onOpenGovernance}>
            <Menu className="h-4 w-4" />
          </IconButton>
        )}
        <div className="vish-logo-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1">
          <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS logo" className="h-full w-full rounded-lg object-cover" />
        </div>
        <span className="truncate text-sm font-semibold text-ws-text">{projectName}</span>
      </div>

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="vish-mode-tab-group" role="tablist" aria-label="Editor modes">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected
              className="vish-mode-tab active"
            >
              {mode.icon && <mode.icon className="h-3 w-3" />}
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
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
        <IconButton label="More options" onClick={showStub}>
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}
