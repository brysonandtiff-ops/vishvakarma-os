import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import { importProject, type ImportResult } from '@/modules/import';
import type { ProjectManifest } from '@/types';
import { scaleManifestGeometry } from '@/utils/manifestGeometry';

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
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [importKind, setImportKind] = useState<'json' | 'svg' | 'dxf' | null>(null);
  const [dxfScale, setDxfScale] = useState(1);
  const isCoarsePointer = useCoarsePointer();

  const resetState = () => {
    setError(null);
    setPreview(null);
    setImportKind(null);
    setDxfScale(1);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setImporting(true);
    setError(null);
    setPreview(null);

    try {
      const result = await importProject(file);

      if (!result.success || !result.manifest) {
        setError(result.errors.join(' ') || 'Import failed. Use JSON, SVG, or DXF floor plan files.');
        return;
      }

      setPreview(result);
      const ext = file.name.split('.').pop()?.toLowerCase();
      setImportKind(ext === 'dxf' ? 'dxf' : ext === 'svg' ? 'svg' : 'json');
    } catch (importError) {
      console.error('Import failed:', importError);
      setError('Import failed. Check the file format and try again.');
    } finally {
      setImporting(false);
    }
  };

  const applyImport = () => {
    if (!preview?.manifest) return;
    const manifest =
      importKind === 'dxf' && dxfScale !== 1
        ? scaleManifestGeometry(preview.manifest, dxfScale)
        : preview.manifest;
    onImported(manifest);
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) resetState();
      }}
    >
      <DialogContent className="vish-dialog-chrome max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 md:max-w-lg">
        <DialogHeader className="items-center text-center">
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            आयात · Import
          </div>
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Import Floor Plan</DialogTitle>
          <DialogDescription>
            Restore a Vishvakarma JSON export, SVG floor plan, or DXF LINE geometry into the editor.
          </DialogDescription>
        </DialogHeader>

        {!preview && (
          <div className="rounded-2xl border border-primary/15 bg-white/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Supported formats</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>JSON — full Vishvakarma project manifest</li>
              <li>SVG — round-trip Vishvakarma floor plan export</li>
              <li>DXF — LINE wall geometry (scale preview shown)</li>
            </ul>
            {isCoarsePointer && (
              <p className="mt-3 text-xs text-muted-foreground">
                On iPad, tap Browse Files to pick from Files or iCloud Drive.
              </p>
            )}
          </div>
        )}

        {preview?.manifest && (
          <div className="space-y-3 rounded-2xl border border-primary/15 bg-white/70 p-4">
            <div className="overflow-hidden rounded-lg border border-border bg-[#f5f1e8]">
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildFloorPlanSvg(preview.manifest))}`}
                alt="Import preview"
                className="h-40 w-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Walls</span> <span className="font-mono">{preview.manifest.walls.length}</span></div>
              <div><span className="text-muted-foreground">Openings</span> <span className="font-mono">{preview.manifest.openings.length}</span></div>
              <div><span className="text-muted-foreground">Rooms</span> <span className="font-mono">{preview.manifest.rooms?.length ?? 0}</span></div>
              <div><span className="text-muted-foreground">Floors</span> <span className="font-mono">{preview.manifest.floors?.length ?? 1}</span></div>
            </div>
            {preview.warnings.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {preview.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            )}
            {importKind === 'dxf' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="dxf-scale">
                  Scale adjustment ({dxfScale.toFixed(2)}×)
                </label>
                <input
                  id="dxf-scale"
                  type="range"
                  min={0.25}
                  max={4}
                  step={0.05}
                  value={dxfScale}
                  onChange={(e) => setDxfScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".json,.svg,.dxf,application/json,image/svg+xml"
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
          {preview?.manifest ? (
            <Button disabled={importing} className="touch-target bg-primary text-primary-foreground" onClick={applyImport}>
              Apply import
            </Button>
          ) : (
            <Button
              disabled={importing}
              className="touch-target bg-primary text-primary-foreground"
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
                  {isCoarsePointer ? 'Browse Files' : 'Choose File'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
