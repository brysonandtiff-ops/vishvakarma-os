import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ExportFloorPlanDialog({
  open,
  onOpenChange,
  onExportJSON,
  projectName,
  wallCount,
  openingCount,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onExportJSON: () => void;
  projectName: string;
  wallCount: number;
  openingCount: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 bg-stone-50 md:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileDown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Export Floor Plan?</DialogTitle>
          <DialogDescription>
            Download a portable Vishvakarma project file for handoff, backup, or future import.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-2xl font-bold text-primary">{wallCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Walls</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-2xl font-bold text-primary">{openingCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Openings</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onExportJSON();
              onOpenChange(false);
            }}
            className="bg-primary text-primary-foreground"
          >
            Export JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
