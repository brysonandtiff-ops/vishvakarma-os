import type { ReactNode } from 'react';
/** @deprecated Use EditorSidebarSections in AppLayout workspace sidebar instead. Kept for safe rollback. */
import {
  Box,
  Download,
  FileDown,
  FolderOpen,
  Grid3x3,
  Plus,
  Save,
  Package,
} from 'lucide-react';
import CopilotSwanMark from '@/components/brand/CopilotSwanMark';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface EditorMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onLoadSample: () => void;
  onAIDesigner?: () => void;
  onToggle3D: () => void;
  onToggleGrid: () => void;
  show3DView: boolean;
  gridVisible: boolean;
}

function MenuAction({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={`touch-target h-12 w-full justify-start gap-3 text-sm ${active ? 'border-primary/50 bg-primary/10' : ''}`}
      onClick={onClick}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      {label}
    </Button>
  );
}

export default function EditorMenuSheet({
  open,
  onOpenChange,
  onNewProject,
  onOpenProject,
  onSave,
  onImport,
  onExport,
  onLoadSample,
  onAIDesigner,
  onToggle3D,
  onToggleGrid,
  show3DView,
  gridVisible,
}: EditorMenuSheetProps) {
  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 border-r border-ws-border bg-ws-sidebar p-0">
        <SheetHeader className="border-b border-ws-border px-4 py-4 text-left">
          <SheetTitle className="text-ws-text">Editor menu</SheetTitle>
          <SheetDescription className="text-ws-text-dim">
            Project actions and view controls
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-ws-text-faint">Project</p>
          <MenuAction icon={<Plus className="h-4 w-4" />} label="New project" onClick={() => run(onNewProject)} />
          <MenuAction icon={<FolderOpen className="h-4 w-4" />} label="Open project" onClick={() => run(onOpenProject)} />
          <MenuAction icon={<Save className="h-4 w-4" />} label="Save" onClick={() => run(onSave)} />
          <MenuAction icon={<Download className="h-4 w-4" />} label="Import floor plan" onClick={() => run(onImport)} />
          <MenuAction icon={<FileDown className="h-4 w-4" />} label="Export floor plan" onClick={() => run(onExport)} />
          <MenuAction icon={<Package className="h-4 w-4" />} label="Load sample blueprint" onClick={() => run(onLoadSample)} />
          {onAIDesigner && (
            <MenuAction
              icon={<CopilotSwanMark motion="idle" size="xs" />}
              label="Architecture Copilot"
              onClick={() => run(onAIDesigner)}
            />
          )}
          <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-ws-text-faint">View</p>
          <MenuAction icon={<Box className="h-4 w-4" />} label={show3DView ? 'Hide 3D view' : 'Show 3D view'} active={show3DView} onClick={() => run(onToggle3D)} />
          <MenuAction icon={<Grid3x3 className="h-4 w-4" />} label={gridVisible ? 'Hide grid' : 'Show grid'} active={gridVisible} onClick={() => run(onToggleGrid)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
