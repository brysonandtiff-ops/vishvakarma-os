// Keyboard Shortcuts Help Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

export default function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
          title="Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline" aria-hidden="true">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for drawing tools, view toggles, editing commands, and keyboard workflows.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-sm">Tools</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Select Tool</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">V</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wall Tool</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">W</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Door Tool</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">D</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Window Tool</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Measure Tool</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">M</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-sm">View</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle Grid</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">G</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle Snap</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Shift+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle 3D View</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">3</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-sm">Edit</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Undo</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redo</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+Shift+Z</kbd>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hover over walls with Measure tool to see dimensions</li>
              <li>Click walls with Door/Window tools to place openings</li>
              <li>Selected walls show measurements automatically</li>
              <li>Snap-to-grid helps align walls precisely</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
