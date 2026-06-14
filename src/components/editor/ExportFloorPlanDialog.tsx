import { FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { editorDialogClassName } from '@/lib/editorDialog';
import { exportManifestToDxf } from '@/core/exporters/dxfExport';
import { buildFloorPlanSvg } from '@/core/exporters/floorPlanSvg';
import { downloadPdf } from '@/core/exporters/pdfExport';
import { downloadBlob, exportManifestToPng } from '@/core/exporters/pngExport';
import type { ProjectManifest } from '@/types';
import { toast } from 'sonner';

const FORMAT_CHIPS = {
  json: 'Full manifest round-trip',
  png: 'Walls · openings · labels · dimensions',
  pdf: 'Walls · openings · labels · dimensions · title block',
  dxf: 'Walls · openings as LINE entities',
  svg: 'Vector floor plan — walls · openings · labels · dimensions',
} as const;

export default function ExportFloorPlanDialog({
  open,
  onOpenChange,
  onExportJSON,
  manifest,
  projectName,
  wallCount,
  openingCount,
  tier = 'studio',
  exportBlocked = false,
  exportBlockReason,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onExportJSON: () => void;
  manifest: ProjectManifest;
  projectName: string;
  wallCount: number;
  openingCount: number;
  tier?: 'starter' | 'studio' | 'enterprise';
  exportBlocked?: boolean;
  exportBlockReason?: string;
}) {
  const canPdf = tier !== 'starter';
  const canDxf = tier !== 'starter';

  const slug = projectName.replace(/\s+/g, '-').toLowerCase();

  const exportPng = async () => {
    try {
      const blob = await exportManifestToPng(manifest);
      downloadBlob(blob, `${slug}.png`);
      toast.success('PNG exported');
      onOpenChange(false);
    } catch {
      toast.error('PNG export failed');
    }
  };

  const exportSvg = () => {
    try {
      const svg = buildFloorPlanSvg(manifest);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, `${slug}.svg`);
      toast.success('SVG exported');
      onOpenChange(false);
    } catch {
      toast.error('SVG export failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={editorDialogClassName}>
        <DialogHeader className="items-center text-center">
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileDown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Export Package</DialogTitle>
          <DialogDescription>
            Choose a format below. PDF is recommended for sharing visual floor plans.
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

        <div className="space-y-2 text-[10px] text-muted-foreground">
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px]">PDF</Badge>
            <span>{FORMAT_CHIPS.pdf}</span>
            <Badge className="bg-primary text-[9px] text-primary-foreground">Recommended</Badge>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px]">PNG</Badge>
            <span>{FORMAT_CHIPS.png}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px]">DXF</Badge>
            <span>{FORMAT_CHIPS.dxf}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px]">SVG</Badge>
            <span>{FORMAT_CHIPS.svg}</span>
          </p>
        </div>

        {exportBlocked && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="export-blocked-message">
            Export blocked — resolve building compliance failures before exporting.
            {exportBlockReason ? ` ${exportBlockReason}` : ''}
          </p>
        )}

        <DialogFooter className="flex flex-col gap-3 sm:items-center">
          <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" disabled={exportBlocked} onClick={exportPng} title={FORMAT_CHIPS.png}>PNG</Button>
          <Button variant="outline" disabled={exportBlocked} onClick={exportSvg} title={FORMAT_CHIPS.svg}>SVG</Button>
          <Button
            disabled={!canPdf || exportBlocked}
            className="bg-primary text-primary-foreground"
            title={FORMAT_CHIPS.pdf}
            onClick={() => {
              void downloadPdf(manifest, true).then(() => {
                onOpenChange(false);
                toast.success('PDF floor plan exported');
              }).catch(() => toast.error('PDF export failed'));
            }}
          >
            PDF
            <Badge variant="secondary" className="ml-1.5 bg-primary-foreground/15 text-[9px] text-primary-foreground">Recommended</Badge>
          </Button>
          <Button
            disabled={!canDxf || exportBlocked}
            variant="outline"
            title={FORMAT_CHIPS.dxf}
            onClick={() => {
              const dxf = exportManifestToDxf(manifest);
              const blob = new Blob([dxf], { type: 'application/dxf' });
              downloadBlob(blob, `${slug}.dxf`);
              onOpenChange(false);
              toast.success('DXF exported');
            }}
          >
            DXF
          </Button>
          <Button
            variant="outline"
            disabled={exportBlocked}
            data-testid="export-json-button"
            onClick={() => {
              onExportJSON();
              onOpenChange(false);
            }}
            title={FORMAT_CHIPS.json}
          >
            JSON
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
