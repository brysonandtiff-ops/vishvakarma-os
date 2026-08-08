import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { editorDialogClassName } from '@/lib/editorDialog';
import { exportManifestToDxf } from '@/core/exporters/dxfExport';
import { buildFloorPlanSvg, type FloorPlanSvgOptions } from '@/core/exporters/floorPlanSvg';
import { downloadPdf } from '@/core/exporters/pdfExport';
import { downloadSheetSetPdf } from '@/modules/sheetSet/sheetSetPdfExport';
import { downloadBlob, exportManifestToPng } from '@/core/exporters/pngExport';
import { trackEvent } from '@/lib/analytics';
import type { ProjectManifest } from '@/types';
import { toast } from 'sonner';

const FORMAT_CHIPS = {
  json: 'Full manifest round-trip',
  png: 'Walls · openings · labels · dimensions',
  pdf: 'Walls · openings · labels · dimensions · title block',
  sheetSet: 'Multi-page title · plan · elevation stub sheets',
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
  const [layerOptions, setLayerOptions] = useState<FloorPlanSvgOptions>({
    includeRooms: true,
    includeFurniture: true,
    includeDimensions: true,
    includeLabels: true,
  });

  const svgOptions = layerOptions;

  const canPdf = tier !== 'starter';
  const canDxf = tier !== 'starter';

  const slug = projectName.replace(/\s+/g, '-').toLowerCase();

  const exportPng = async () => {
    try {
      const blob = await exportManifestToPng(manifest, svgOptions);
      downloadBlob(blob, `${slug}.png`);
      trackEvent('project_exported', { format: 'png' });
      toast.success('PNG exported');
      onOpenChange(false);
    } catch {
      toast.error('PNG export failed');
    }
  };

  const exportSvg = () => {
    try {
      const svg = buildFloorPlanSvg(manifest, svgOptions);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, `${slug}.svg`);
      trackEvent('project_exported', { format: 'svg' });
      toast.success('SVG exported');
      onOpenChange(false);
    } catch {
      toast.error('SVG export failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${editorDialogClassName} border-vish-navy-600/50 bg-vish-navy-950/80 backdrop-blur-2xl shadow-2xl`} data-tutorial="export-dialog">
        <DialogHeader className="items-center text-center">
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5 shadow-inner">
            <FileDown className="h-8 w-8 text-vish-gold" />
          </div>
          <DialogTitle className="text-white">Export Package</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose a format below. PDF is recommended for sharing visual floor plans.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 text-sm shadow-inner">
          <div className="flex items-center justify-between border-b border-vish-navy-700/50 pb-2">
            <span className="font-technical text-xs font-bold uppercase tracking-widest text-slate-400">Project</span>
            <span className="font-medium text-white">{projectName}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-vish-navy-800/40 border border-vish-navy-700/30 p-3">
              <p className="text-2xl font-bold text-vish-gold">{wallCount}</p>
              <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Walls</p>
            </div>
            <div className="rounded-xl bg-vish-navy-800/40 border border-vish-navy-700/30 p-3">
              <p className="text-2xl font-bold text-vish-gold">{openingCount}</p>
              <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Openings</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 text-xs shadow-inner">
          <p className="mb-2 font-technical font-bold uppercase tracking-widest text-slate-400">Export layers</p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['includeRooms', 'Rooms'],
                ['includeFurniture', 'Furniture'],
                ['includeDimensions', 'Dimensions'],
                ['includeLabels', 'Labels'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-slate-300">
                <input
                  type="checkbox"
                  checked={layerOptions[key] ?? true}
                  onChange={(e) => setLayerOptions((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="accent-vish-gold"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-[10px] text-slate-400">
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] bg-vish-navy-800 text-slate-300">PDF</Badge>
            <span>{FORMAT_CHIPS.pdf}</span>
            <Badge className="bg-vish-gold text-[9px] text-vish-navy-950 font-bold border-none">Recommended</Badge>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] bg-vish-navy-800 text-slate-300">Sheet set</Badge>
            <span>{FORMAT_CHIPS.sheetSet}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] bg-vish-navy-800 text-slate-300">PNG</Badge>
            <span>{FORMAT_CHIPS.png}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] bg-vish-navy-800 text-slate-300">DXF</Badge>
            <span>{FORMAT_CHIPS.dxf}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] bg-vish-navy-800 text-slate-300">SVG</Badge>
            <span>{FORMAT_CHIPS.svg}</span>
          </p>
        </div>

        {exportBlocked && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400" data-testid="export-blocked-message">
            Export blocked — resolve building compliance failures before exporting.
            {exportBlockReason ? ` ${exportBlockReason}` : ''}
          </p>
        )}

        <DialogFooter className="flex flex-col gap-3 sm:items-center">
          <div className="flex flex-wrap justify-center gap-2">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800" disabled={exportBlocked} onClick={exportPng} title={FORMAT_CHIPS.png}>PNG</Button>
          <Button variant="outline" className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800" disabled={exportBlocked} onClick={exportSvg} title={FORMAT_CHIPS.svg}>SVG</Button>
          <Button
            disabled={!canPdf || exportBlocked}
            variant="outline"
            className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800"
            title={FORMAT_CHIPS.sheetSet}
            data-testid="export-sheet-set-pdf"
            onClick={() => {
              downloadSheetSetPdf(manifest);
              trackEvent('project_exported', { format: 'sheet-set-pdf' });
              onOpenChange(false);
              toast.success('Sheet set PDF exported');
            }}
          >
            Sheet set PDF
          </Button>
          <Button
            disabled={!canPdf || exportBlocked}
            className="bg-vish-gold hover:bg-vish-gold-light text-vish-navy-950 font-bold shadow-lg shadow-vish-gold/20 tracking-wide"
            title={FORMAT_CHIPS.pdf}
            onClick={() => {
              void downloadPdf(manifest, true).then(() => {
                trackEvent('project_exported', { format: 'pdf' });
                onOpenChange(false);
                toast.success('PDF floor plan exported');
              }).catch(() => toast.error('PDF export failed'));
            }}
          >
            PDF
            <Badge variant="secondary" className="ml-1.5 bg-vish-navy-950/20 text-[9px] text-vish-navy-950 border-none">Recommended</Badge>
          </Button>
          <Button
            disabled={!canDxf || exportBlocked}
            variant="outline"
            className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800"
            title={FORMAT_CHIPS.dxf}
            onClick={() => {
              const dxf = exportManifestToDxf(manifest);
              const blob = new Blob([dxf], { type: 'application/dxf' });
              downloadBlob(blob, `${slug}.dxf`);
              trackEvent('project_exported', { format: 'dxf' });
              onOpenChange(false);
              toast.success('DXF exported');
            }}
          >
            DXF
          </Button>
          <Button
            variant="outline"
            className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800"
            disabled={exportBlocked}
            data-testid="export-json-button"
            onClick={() => {
              onExportJSON();
              trackEvent('project_exported', { format: 'json' });
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
