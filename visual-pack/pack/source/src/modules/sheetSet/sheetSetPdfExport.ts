import { composeSheetSet, type SheetSetComposition } from '@/modules/sheetSet/sheetSetComposer';
import { buildMultiPageTextPdf, pdfBytesToBlob } from '@/utils/minimalPdf';
import type { ProjectManifest } from '@/types';
import type { SheetSetComposeOptions } from '@/modules/sheetSet/sheetSetComposer';

function sheetToLines(page: SheetSetComposition['pages'][number]): string[] {
  const lines = [
    `Sheet ${page.sheetNumber}`,
    `Kind: ${page.kind}`,
    `Orientation: ${page.orientation}`,
    `Render hint: ${page.renderHint}`,
  ];
  if (page.floorIndex != null) {
    lines.push(`Floor index: ${page.floorIndex}`);
  }
  return lines;
}

export function buildSheetSetPdfBytes(
  manifest: ProjectManifest,
  options: SheetSetComposeOptions = {},
): Uint8Array {
  const composition = composeSheetSet(manifest, options);
  const sheets = composition.pages.map((page) => {
    const warningLines: string[] = [];
    if (composition.warnings.length > 0) {
      warningLines.push('', 'Warnings:', ...composition.warnings.map((w) => `• ${w}`));
    }
    return {
      title: page.title,
      lines: [...sheetToLines(page), '', composition.disclaimer, ...warningLines],
    };
  });

  return buildMultiPageTextPdf(sheets);
}

export function downloadSheetSetPdf(
  manifest: ProjectManifest,
  options: SheetSetComposeOptions = {},
): void {
  const bytes = buildSheetSetPdfBytes(manifest, options);
  const blob = pdfBytesToBlob(bytes);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${manifest.name.replace(/\s+/g, '-').toLowerCase()}-sheet-set.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export { composeSheetSet };
