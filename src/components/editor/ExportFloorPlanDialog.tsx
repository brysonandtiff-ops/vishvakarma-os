import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportManifestToDxf } from '@/core/exporters/dxfExport';
import { downloadPdf } from '@/core/exporters/pdfExport';
import { downloadBlob, exportManifestToPng } from '@/core/exporters/pngExport';
import type { ProjectManifest } from '@/types';
import { toast } from 'sonner';

export default function ExportFloorPlanDialog({
  open,
  onOpenChange,
  onExportJSON,
  manifest,
  projectName,
  wallCount,
  openingCount,
  tier = 'studio',
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onExportJSON: () => void;
  manifest: ProjectManifest;
  projectName: string;
  wallCount: number;
  openingCount: number;
  tier?: 'starter' | 'studio' | 'enterprise';
}) {
  const canPdf = tier !== 'starter';
  const canDxf = tier !== 'starter';

  const exportPng = async () => {
    try {
      const blob = await exportManifestToPng(manifest);
      downloadBlob(blob, `${projectName.replace(/\s+/g, '-').toLowerCase()}.png`);
      toast.success('PNG exported');
      onOpenChange(false);
    } catch {
      toast.error('PNG export failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 bg-stone-50 md:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileDown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Export Package</DialogTitle>
          <DialogDescription>
            JSON full manifest · PNG 2D walls raster · PDF visual floor plan · DXF basic LINE entities
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

        <DialogFooter className="flex flex-col gap-3 sm:items-center">
          <p className="w-full text-center text-[10px] text-muted-foreground">
            PNG: walls only · PDF: visual plan with labels and dimensions · DXF: walls &amp; openings as LINE
          </p>
          <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={exportPng} title="2D walls raster — openings not included">PNG</Button>
          <Button
            disabled={!canPdf}
            title="Summary sheet with project name and date — not a CAD drawing"
            onClick={() => {
              void downloadPdf(manifest, true).then(() => {
                onOpenChange(false);
                toast.success('PDF floor plan exported');
              }).catch(() => toast.error('PDF export failed'));
            }}
          >
            PDF
          </Button>
          <Button
            disabled={!canDxf}
            title="Basic LINE entities for walls and openings"
            onClick={() => {
              const dxf = exportManifestToDxf(manifest);
              const blob = new Blob([dxf], { type: 'application/dxf' });
              downloadBlob(blob, `${projectName.replace(/\s+/g, '-').toLowerCase()}.dxf`);
              onOpenChange(false);
              toast.success('DXF exported');
            }}
          >
            DXF
          </Button>
          <Button
            onClick={() => {
              onExportJSON();
              onOpenChange(false);
            }}
            className="bg-primary text-primary-foreground"
            title="Full ProjectManifest JSON round-trip"
          >
            JSON
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
