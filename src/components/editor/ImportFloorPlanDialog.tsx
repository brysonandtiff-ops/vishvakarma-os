import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { importProject } from '@/modules/import';
import type { ProjectManifest } from '@/types';

export default function ImportFloorPlanDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onImported: (manifest: ProjectManifest) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setImporting(true);
    setError(null);

    try {
      const result = await importProject(file);

      if (!result.success || !result.manifest) {
        setError(result.errors.join(' ') || 'Import failed. Use a Vishvakarma JSON export or compatible SVG.');
        return;
      }

      onImported(result.manifest);
      onOpenChange(false);
    } catch (importError) {
      console.error('Import failed:', importError);
      setError('Import failed. Check the file format and try again.');
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 bg-stone-50 md:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            आयात · Import
          </div>
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Import Floor Plan</DialogTitle>
          <DialogDescription>
            Restore a Vishvakarma JSON export or SVG floor plan into the editor workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-primary/15 bg-white/70 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Supported formats</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>JSON — full Vishvakarma project manifest</li>
            <li>SVG — wall geometry exported from Vishvakarma.OS</li>
          </ul>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".json,.svg,application/json,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            disabled={importing}
            className="bg-primary text-primary-foreground"
            onClick={() => inputRef.current?.click()}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Choose File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
