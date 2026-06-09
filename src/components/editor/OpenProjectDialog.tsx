import { FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Project } from '@/types';

export default function OpenProjectDialog({
  open,
  projects,
  onOpenChange,
  onLoadProject,
}: {
  open: boolean;
  projects: Project[];
  onOpenChange: (value: boolean) => void;
  onLoadProject: (project: Project) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vish-dialog-chrome max-w-[calc(100%-2rem)] rounded-3xl md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
          <DialogDescription>Load a saved blueprint from your workspace.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-80 pr-3">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No saved projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Create a new project to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                  onClick={() => onLoadProject(project)}
                >
                  <p className="font-semibold text-foreground">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.description || 'No description'}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground/60">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
