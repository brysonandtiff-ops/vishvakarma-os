import {
  Box,
  ExternalLink,
  Grid3x3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { EditorSidebarConfig } from '@/components/editor/EditorSidebarContext';
import { getEditorProjectAction } from '@/editor/editorActionRegistry';

interface EditorSidebarSectionsProps {
  config: EditorSidebarConfig;
  collapsed?: boolean;
  onAfterAction?: () => void;
}

interface ActionDef {
  id: string;
  testId: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function SidebarActionButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  loading,
  testId,
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  testId: string;
  collapsed?: boolean;
}) {
  const button = (
    <Button
      type="button"
      variant="outline"
      data-testid={testId}
      disabled={disabled || loading}
      className={`vish-editor-sidebar-action touch-target w-full justify-start gap-3 text-sm ${
        collapsed ? 'h-10 w-10 min-h-[44px] min-w-[44px] justify-center p-0' : 'min-h-[44px] h-12'
      } ${active ? 'border-primary/50 bg-primary/10' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Icon className="h-4 w-4 shrink-0" />}
      {!collapsed && label}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={6} className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function ActionSection({
  title,
  testId,
  actions,
  collapsed,
  onAfterAction,
}: {
  title: string;
  testId: string;
  actions: ActionDef[];
  collapsed?: boolean;
  onAfterAction?: () => void;
}) {
  const run = (action: ActionDef) => {
    action.onClick();
    onAfterAction?.();
  };

  return (
    <div className="vish-editor-sidebar-section" data-testid={testId}>
      {!collapsed && (
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-ws-text-faint">
          {title}
        </p>
      )}
      <div className={`space-y-1 ${collapsed ? 'px-0' : 'px-0'}`}>
        {actions.map((action) => (
          <SidebarActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            testId={action.testId}
            active={action.active}
            disabled={action.disabled}
            loading={action.loading}
            collapsed={collapsed}
            onClick={() => run(action)}
          />
        ))}
      </div>
    </div>
  );
}

export default function EditorSidebarSections({
  config,
  collapsed = false,
  onAfterAction,
}: EditorSidebarSectionsProps) {
  const navigate = useNavigate();
  const open3DRoom = config.onOpen3DRoom ?? (() => {
    config.onSave();
    navigate('/3d-room');
  });

  const projectActions: ActionDef[] = [
    {
      id: 'new-project',
      testId: 'editor-sidebar-new-project',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'newProject')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'newProject')!.label,
      onClick: config.onNewProject,
    },
    {
      id: 'open-project',
      testId: 'editor-sidebar-open-project',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'openProject')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'openProject')!.label,
      onClick: config.onOpenProject,
    },
    {
      id: 'save',
      testId: 'editor-sidebar-save',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'save')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'save')!.label,
      onClick: config.onSave,
      loading: config.savingProject,
      disabled: config.savingProject,
    },
    {
      id: 'import',
      testId: 'editor-sidebar-import',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'import')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'import')!.label,
      onClick: config.onImport,
    },
    {
      id: 'export',
      testId: 'editor-sidebar-export',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'export')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'export')!.label,
      onClick: config.onExport,
    },
    {
      id: 'load-sample',
      testId: 'editor-sidebar-load-sample',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'loadSample')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'loadSample')!.label,
      onClick: config.onLoadSample,
    },
    {
      id: 'ai-copilot',
      testId: 'editor-sidebar-ai-copilot',
      icon: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'aiDesigner')!.icon,
      label: EDITOR_PROJECT_ACTIONS.find((a) => a.id === 'aiDesigner')!.label,
      onClick: config.onAIDesigner,
    },
  ];

  const viewActions: ActionDef[] = [
    {
      id: 'open-3d-room',
      testId: 'editor-sidebar-open-3d-room',
      icon: ExternalLink,
      label: 'Open 3D Room',
      onClick: open3DRoom,
    },
    {
      id: 'toggle-3d',
      testId: 'editor-sidebar-toggle-3d',
      icon: Box,
      label: config.show3DView ? 'Hide 3D view' : 'Show 3D view',
      onClick: config.onToggle3D,
      active: config.show3DView,
    },
    {
      id: 'toggle-grid',
      testId: 'editor-sidebar-toggle-grid',
      icon: Grid3x3,
      label: config.gridVisible ? 'Hide grid' : 'Show grid',
      onClick: config.onToggleGrid,
      active: config.gridVisible,
    },
  ];

  return (
    <div className={`space-y-3 ${collapsed ? 'pt-1' : 'pt-2'}`}>
      <ActionSection
        title="Project actions"
        testId="editor-sidebar-project-actions"
        actions={projectActions}
        collapsed={collapsed}
        onAfterAction={onAfterAction}
      />
      <ActionSection
        title="View"
        testId="editor-sidebar-view"
        actions={viewActions}
        collapsed={collapsed}
        onAfterAction={onAfterAction}
      />
    </div>
  );
}
