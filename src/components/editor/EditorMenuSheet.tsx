import {
  Box,
  Download,
  FileDown,
  FolderOpen,
  Grid3x3,
  Plus,
  Save,
  Package,
  Sparkles,
} from 'lucide-react';
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
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Plus;
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
      <Icon className="h-4 w-4 shrink-0" />
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
          <MenuAction icon={Plus} label="New project" onClick={() => run(onNewProject)} />
          <MenuAction icon={FolderOpen} label="Open project" onClick={() => run(onOpenProject)} />
          <MenuAction icon={Save} label="Save" onClick={() => run(onSave)} />
          <MenuAction icon={Download} label="Import floor plan" onClick={() => run(onImport)} />
          <MenuAction icon={FileDown} label="Export floor plan" onClick={() => run(onExport)} />
          <MenuAction icon={Package} label="Load sample blueprint" onClick={() => run(onLoadSample)} />
          {onAIDesigner && <MenuAction icon={Sparkles} label="AI Building Designer" onClick={() => run(onAIDesigner)} />}
          <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-ws-text-faint">View</p>
          <MenuAction icon={Box} label={show3DView ? 'Hide 3D view' : 'Show 3D view'} active={show3DView} onClick={() => run(onToggle3D)} />
          <MenuAction icon={Grid3x3} label={gridVisible ? 'Hide grid' : 'Show grid'} active={gridVisible} onClick={() => run(onToggleGrid)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
