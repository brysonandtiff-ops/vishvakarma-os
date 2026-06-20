import type { ReactNode } from 'react';
import {
  Box,
  ChevronDown,
  FileDown,
  FolderOpen,
  Grid3x3,
  Leaf,
  Loader2,
  Lock,
  Maximize2,
  Menu,
  MoreHorizontal,
  PenLine,
  Plus,
  Redo2,
  Route,
  Save,
  Sofa,
  Undo2,
  Upload,
  Wind,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import CopilotSwanMark from '@/components/brand/CopilotSwanMark';
import { getProjectActionLabel } from '@/editor/editorActionRegistry';
import type { WorkspaceMode } from '@/types';
import TutorialHelpButton from '@/tutorial/TutorialHelpButton';

interface EditorTopBarProps {
  projectName: string;
  show3DView: boolean;
  expand3DPanel?: boolean;
  onToggleExpand3D?: () => void;
  workspaceMode: WorkspaceMode;
  zenMode?: boolean;
  presentationLock?: boolean;
  savingProject?: boolean;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onToggleZen?: () => void;
  onTogglePresentationLock?: () => void;
  onToggle3D: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onNewProject: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onLoadSample?: () => void;
  onOpenAIDesigner?: () => void;
  onOpenArchitectureBot?: () => void;
  onOpenEditorMenu?: () => void;
  onOpenGovernance?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  fileStrip?: ReactNode;
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
  dataTutorial,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  dataTutorial?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      data-tutorial={dataTutorial}
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

function ModeTabs({
  workspaceMode,
  onWorkspaceModeChange,
}: {
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
}) {
  return (
    <div className="vish-mode-tab-group max-w-full overflow-x-auto" role="tablist" aria-label="Editor modes">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={workspaceMode === mode.id}
          className={`vish-mode-tab shrink-0 ${workspaceMode === mode.id ? 'active' : ''}`}
          onClick={() => onWorkspaceModeChange(mode.id)}
          data-tutorial={`mode-${mode.id}`}
        >
          <mode.icon className="h-3 w-3" />
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default function EditorTopBar({
  projectName,
  show3DView,
  expand3DPanel = false,
  onToggleExpand3D,
  workspaceMode,
  zenMode = false,
  presentationLock = false,
  savingProject = false,
  onWorkspaceModeChange,
  onToggleZen,
  onTogglePresentationLock,
  onToggle3D,
  gridVisible,
  onToggleGrid,
  onNewProject,
  onExport,
  onImport,
  onOpenProject,
  onSaveProject,
  onLoadSample,
  onOpenAIDesigner,
  onOpenArchitectureBot,
  onOpenEditorMenu,
  onOpenGovernance,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  fileStrip,
}: EditorTopBarProps) {
  const activeMode = MODES.find((m) => m.id === workspaceMode) ?? MODES[0];

  return (
    <header className="vish-editor-topbar shrink-0" data-testid="editor-top-bar">
      <div className="vish-editor-topbar-grid">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          {onOpenEditorMenu && (
            <IconButton label="Open workspace navigation" onClick={onOpenEditorMenu}>
              <Menu className="h-4 w-4" />
            </IconButton>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="vish-editor-mode-badge touch-target"
                aria-label={`Workspace mode: ${activeMode.label}`}
                data-testid="editor-mode-badge"
              >
                <activeMode.icon className="h-3.5 w-3.5" />
                {activeMode.label}
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="vish-fade-rise w-44">
              {MODES.map((mode) => (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => onWorkspaceModeChange(mode.id)}
                  className={workspaceMode === mode.id ? 'bg-primary/10 text-primary' : ''}
                >
                  <mode.icon className="mr-2 h-4 w-4" />
                  {mode.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="vish-logo-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS logo" className="h-full w-full rounded-lg object-cover" />
          </div>
          <span className="max-w-[min(12rem,28vw)] truncate text-sm font-semibold text-ws-text">{projectName}</span>
          {savingProject && (
            <span className="vish-editor-save-chip flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Saving
            </span>
          )}
        </div>

        <div className="vish-editor-topbar-center min-w-0 justify-self-center px-1">
          <ModeTabs workspaceMode={workspaceMode} onWorkspaceModeChange={onWorkspaceModeChange} />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1 justify-self-end">
          <IconButton label="Undo" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="h-4 w-4" />
          </IconButton>
          <IconButton label="Redo" disabled={!canRedo} onClick={onRedo}>
            <Redo2 className="h-4 w-4" />
          </IconButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Project actions"
                data-tutorial="project-actions"
                className="vish-editor-icon-btn touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent text-ws-text-dim hover:border-ws-border hover:bg-ws-hover hover:text-ws-text"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="vish-fade-rise w-48">
              <DropdownMenuItem onClick={onNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                New project
              </DropdownMenuItem>
              {onOpenProject && (
                <DropdownMenuItem onClick={onOpenProject}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open…
                </DropdownMenuItem>
              )}
              {onSaveProject && (
                <DropdownMenuItem onClick={onSaveProject} disabled={savingProject}>
                  {savingProject ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </DropdownMenuItem>
              )}
              {onLoadSample && (
                <DropdownMenuItem onClick={onLoadSample}>
                  {getProjectActionLabel('loadSample', 'topbar')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              {onOpenAIDesigner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onOpenAIDesigner} data-testid="editor-ai-designer">
                    <CopilotSwanMark motion="idle" size="xs" className="mr-2" />
                    Architecture Copilot
                  </DropdownMenuItem>
                </>
              )}
              {onOpenArchitectureBot && (
                <DropdownMenuItem onClick={onOpenArchitectureBot} data-testid="editor-architecture-bot">
                  <CopilotSwanMark motion="idle" size="xs" className="mr-2" />
                  Architecture Bot
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <IconButton label="Toggle 3D view" active={show3DView} onClick={onToggle3D} dataTutorial="toggle-3d">
            <Box className="h-4 w-4" />
          </IconButton>
          {show3DView && onToggleExpand3D && (
            <IconButton
              label={expand3DPanel ? 'Collapse 3D panel' : 'Expand 3D panel'}
              active={expand3DPanel}
              onClick={onToggleExpand3D}
              dataTutorial="expand-3d"
            >
              <Maximize2 className="h-4 w-4" />
            </IconButton>
          )}
          <IconButton label="Toggle grid" active={gridVisible} onClick={onToggleGrid}>
            <Grid3x3 className="h-4 w-4" />
          </IconButton>
          <IconButton label="Zen mode" active={zenMode} onClick={() => onToggleZen?.()}>
            <Eye className="h-4 w-4" />
          </IconButton>

          <TutorialHelpButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More editor actions"
                className="vish-editor-icon-btn touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent text-ws-text-dim hover:border-ws-border hover:bg-ws-hover hover:text-ws-text"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="vish-fade-rise w-52">
              <DropdownMenuItem onClick={() => onTogglePresentationLock?.()}>
                <Lock className="mr-2 h-4 w-4" />
                {presentationLock ? 'Unlock presentation' : 'Presentation lock'}
              </DropdownMenuItem>
              {onOpenGovernance && (
                <DropdownMenuItem onClick={onOpenGovernance}>
                  Governance & workspace…
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {fileStrip && <div className="vish-editor-file-strip">{fileStrip}</div>}
    </header>
  );
}
