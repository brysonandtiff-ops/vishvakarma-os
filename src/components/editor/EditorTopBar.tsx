import type { ReactNode } from 'react';
import {
  Box,
  ChevronDown,
  FileDown,
  FolderOpen,
  Footprints,
  Loader2,
  PenLine,
  Redo2,
  Save,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import CopilotSwanMark from '@/components/brand/CopilotSwanMark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProjectActionLabel } from '@/editor/editorActionRegistry';
import { useReliablePress } from '@/hooks/useReliablePress';
import TutorialHelpButton from '@/tutorial/TutorialHelpButton';
import type { WorkspaceMode } from '@/types';

export type StudioView = 'blueprint' | 'orbit' | 'walk';
export type DesignTools = Exclude<WorkspaceMode, 'walk'>;

interface EditorTopBarProps {
  projectName: string;
  view: StudioView;
  onViewChange: (view: StudioView) => void;
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: DesignTools) => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  onResetView: () => void;
  presentationLock: boolean;
  onTogglePresentationLock: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  savingProject: boolean;
  onExport: () => void;
  onImport: () => void;
  onLoadSample: () => void;
  onOpenAIDesigner: () => void;
  onOpenArchitectureBot: () => void;
  onOpenProperties: () => void;
  propertiesOpen: boolean;
  onOpenGovernance: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  fileStrip?: ReactNode;
  monsoonActive: boolean;
  onToggleMonsoon: () => void;
  pranaActive: boolean;
  onTogglePrana: () => void;
}

const VIEWS = [
  { id: 'blueprint', label: 'Blueprint', Icon: PenLine, tutorial: 'mode-draft' },
  { id: 'orbit', label: '3D', Icon: Box, tutorial: 'toggle-3d' },
  { id: 'walk', label: 'Walk', Icon: Footprints, tutorial: 'mode-walk' },
] as const;

const TOOL_SETS: Array<{ id: DesignTools; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'mep', label: 'MEP' },
  { id: 'interior', label: 'Interior' },
  { id: 'landscape', label: 'Landscape' },
];

function StudioButton({
  label, children, onClick, active, primary, disabled, tutorial, testId,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
  tutorial?: string;
  testId?: string;
}) {
  const press = useReliablePress(disabled ? undefined : onClick);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      data-tutorial={tutorial}
      data-testid={testId}
      className={`vish-studio-button touch-manipulation${primary ? ' vish-studio-button--primary' : ''}`}
      {...press}
    >
      {children}
    </button>
  );
}

export default function EditorTopBar({
  projectName, view, onViewChange, workspaceMode, onWorkspaceModeChange,
  splitView, onToggleSplitView, onResetView, presentationLock, onTogglePresentationLock,
  zenMode, onToggleZen, gridVisible, onToggleGrid,
  onNewProject, onOpenProject, onSaveProject, savingProject, onExport, onImport,
  onLoadSample, onOpenAIDesigner, onOpenArchitectureBot, onOpenProperties, propertiesOpen, onOpenGovernance,
  onUndo, onRedo, canUndo, canRedo, fileStrip,
  monsoonActive, onToggleMonsoon, pranaActive, onTogglePrana,
}: EditorTopBarProps) {
  return (
    <header className="vish-editor-topbar-chrome vish-studio-bar" data-testid="editor-top-bar">
      <div className="vish-studio-bar__row">
        <div className="vish-studio-bar__project">
          <h1 title={projectName}>{projectName || 'Studio'}</h1>
        </div>

        <div className="vish-studio-views" role="group" aria-label="Studio views">
          {VIEWS.map(({ id, label, Icon, tutorial }) => (
            <StudioButton
              key={id}
              label={label}
              active={view === id}
              disabled={presentationLock && id === 'blueprint'}
              tutorial={tutorial}
              onClick={() => onViewChange(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </StudioButton>
          ))}
        </div>

        <div className="vish-studio-bar__actions">
          <StudioButton label="Save project" primary disabled={savingProject} onClick={onSaveProject}>
            {savingProject ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : <Save size={16} aria-hidden="true" />}
            <span>{savingProject ? 'Saving…' : 'Save'}</span>
          </StudioButton>
          <StudioButton label="Export project" onClick={onExport}>
            <FileDown size={16} aria-hidden="true" />
            <span className="vish-studio-export-label">Export</span>
          </StudioButton>
        </div>
      </div>

      <div className="vish-studio-bar__utilities">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Project actions" data-tutorial="project-actions" className="vish-studio-button">
              <FolderOpen size={16} aria-hidden="true" />
              <span>File</span>
              <ChevronDown size={12} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onSelect={onNewProject}>New project</DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenProject}>Open…</DropdownMenuItem>
            <DropdownMenuItem onSelect={onImport}>Import</DropdownMenuItem>
            <DropdownMenuItem onSelect={onSaveProject} disabled={savingProject}>Save</DropdownMenuItem>
            <DropdownMenuItem onSelect={onExport}>Export</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLoadSample} data-tutorial="load-demo">
              {getProjectActionLabel('loadSample', 'topbar')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenAIDesigner} data-testid="editor-ai-designer">
              <CopilotSwanMark motion="idle" size="xs" className="mr-2" /> Architecture Copilot
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenArchitectureBot} data-testid="editor-architecture-bot">
              <CopilotSwanMark motion="idle" size="xs" className="mr-2" /> Architecture Bot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" data-testid="editor-mode-badge" className="vish-studio-button vish-editor-mode-badge" aria-label="Studio tools">
              <span>Tools</span><ChevronDown size={12} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[min(65dvh,32rem)] overflow-y-auto">
            <DropdownMenuLabel>Drawing tools</DropdownMenuLabel>
            <DropdownMenuGroup>
              {TOOL_SETS.map(({ id, label }) => (
                <DropdownMenuItem key={id} onSelect={() => onWorkspaceModeChange(id)} disabled={presentationLock}>
                  {label}{workspaceMode === id && view === 'blueprint' && <span aria-hidden="true" className="ml-auto text-xs text-muted-foreground">Selected</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onToggleGrid} data-tutorial="toggle-grid">{gridVisible ? 'Hide grid' : 'Show grid'}</DropdownMenuItem>
            {view === 'orbit' && <DropdownMenuItem onSelect={onToggleSplitView} data-tutorial="expand-3d">{splitView ? 'Fill workspace with 3D' : 'Blueprint and 3D side by side'}</DropdownMenuItem>}
            {view !== 'blueprint' && <DropdownMenuItem onSelect={onResetView}>Reset 3D camera</DropdownMenuItem>}
            <DropdownMenuItem onSelect={onToggleZen}>{zenMode ? 'Exit zen mode' : 'Zen mode'}</DropdownMenuItem>
            <DropdownMenuItem onSelect={onTogglePresentationLock}>{presentationLock ? 'Unlock presentation' : 'Presentation lock'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onToggleMonsoon} data-testid="monsoon-rain-toggle">{monsoonActive ? 'Mute Monsoon Rain' : 'Monsoon Rain on Jali'}</DropdownMenuItem>
            <DropdownMenuItem onSelect={onTogglePrana} data-testid="prana-glow-toggle">{pranaActive ? 'Deactivate Prana' : 'Activate Prana Glow'}</DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenGovernance}>Governance &amp; workspace…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="vish-studio-history" role="group" aria-label="Edit history">
          <StudioButton label="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 size={16} aria-hidden="true" /></StudioButton>
          <StudioButton label="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 size={16} aria-hidden="true" /></StudioButton>
        </div>
        {!presentationLock && (
          <StudioButton label="Open properties panel" active={propertiesOpen} onClick={onOpenProperties} testId="studio-inspector">
            <SlidersHorizontal size={16} aria-hidden="true" /><span className="vish-studio-inspector-label">Details</span>
          </StudioButton>
        )}
        <TutorialHelpButton className="vish-studio-help" />
      </div>

      {fileStrip && <div className="vish-editor-file-strip vish-studio-status">{fileStrip}</div>}
    </header>
  );
}
