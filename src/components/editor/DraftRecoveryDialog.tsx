import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw } from 'lucide-react';
import type { LocalDraftPayload } from '@/editor/localDraft';

export default function DraftRecoveryDialog({
  open,
  draft,
  onRestore,
  onDiscard,
}: {
  open: boolean;
  draft: LocalDraftPayload | null;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onDiscard()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl md:max-w-md">
        <DialogHeader>
          <DialogTitle>Recover local draft?</DialogTitle>
          <DialogDescription>
            Vishvakarma.OS found an unsaved local draft from {new Date(draft.savedAt).toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border bg-muted/50 p-4 text-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{draft.projectName}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-card p-3">
              <p className="text-2xl font-bold text-primary">{draft.manifest.walls.length}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Walls</p>
            </div>
            <div className="rounded-xl bg-card p-3">
              <p className="text-2xl font-bold text-primary">{draft.manifest.openings.length}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Openings</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>Discard Draft</Button>
          <Button onClick={onRestore} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restore Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
