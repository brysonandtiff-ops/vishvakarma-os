import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import { exportManifestToPdfBytes } from '@/core/exporters/pdfExport';
import { buildComplianceReportPdfBytes } from '@/modules/compliance/complianceReportExport';
import { isExportAllowed } from '@/services/compliance/complianceGate';
import { buildTextPdf } from '@/utils/minimalPdf';
import JSZip from 'jszip';

function toZipBinary(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

function buildSitePlanTextPdf(building: GeneratedBuilding): Uint8Array {
  const { sitePlan } = building;
  const lines = [
    `Orientation: ${sitePlan.orientation}`,
    `Setbacks — front ${sitePlan.setbacks.front}m · side ${sitePlan.setbacks.side}m · rear ${sitePlan.setbacks.rear}m`,
    '',
    'Parcel boundary vertices:',
    ...sitePlan.parcelBoundary.map((p, i) => `  ${i + 1}. (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`),
    '',
    'Building footprint vertices:',
    ...sitePlan.buildingFootprint.map((p, i) => `  ${i + 1}. (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`),
  ];
  return buildTextPdf(`${building.manifest.name} — Site Plan`, lines);
}

function buildCoverSheetPdf(building: GeneratedBuilding): Uint8Array {
  const lines = [
    'Permit Package — Vishvakarma.OS Architecture Copilot',
    '',
    `Project: ${building.manifest.name}`,
    `Generated: ${building.copilot?.generatedAt ?? new Date().toISOString()}`,
    `Style: ${building.request.style}`,
    `Bedrooms: ${building.request.bedrooms} · Bathrooms: ${building.request.bathrooms}`,
    `Lot area: ${building.request.parcel.area} m²`,
    '',
    'Package contents:',
    '  01 Cover sheet',
    '  02 Site plan',
    '  03 Floor plan',
    '  04 Elevations (placeholder)',
    '  05 Schedules',
    '  06 Material list',
    '  07 Cost estimate',
    '  08 Compliance report',
    '  manifest.json',
    '',
    'Checklist:',
    building.complianceReport.overall === 'pass' ? '[x] Automated compliance pass' : '[ ] Review compliance report',
    '[ ] Verify council-specific conditions',
    '[ ] Engage certifier before lodgement',
  ];
  return buildTextPdf(building.manifest.name, lines);
}

function buildSchedulesPdf(building: GeneratedBuilding): Uint8Array {
  const lines = ['Room schedule:', ''];
  for (const row of building.schedules.rooms) {
    lines.push(`  ${row.name} (${row.type}): ${row.areaSqM.toFixed(1)} m²`);
  }
  lines.push('', 'Wall schedule:', '');
  for (const row of building.schedules.walls) {
    lines.push(`  ${row.id}: ${row.lengthM.toFixed(1)}m × ${row.heightM.toFixed(1)}m · ${row.material}`);
  }
  lines.push('', 'Window schedule:', '');
  for (const row of building.schedules.windows) {
    lines.push(`  ${row.id}: ${row.widthM.toFixed(1)}×${row.heightM.toFixed(1)}m · ${row.roomLabel ?? '—'}`);
  }
  return buildTextPdf(`${building.manifest.name} — Schedules`, lines);
}

function buildMaterialListPdf(building: GeneratedBuilding): Uint8Array {
  const lines = building.materialList.map(
    (row) => `  ${row.item}: ${row.quantity} ${row.unit}${row.notes ? ` (${row.notes})` : ''}`,
  );
  return buildTextPdf(`${building.manifest.name} — Material List`, ['Bill of materials:', '', ...lines]);
}

function buildCostEstimatePdf(building: GeneratedBuilding): Uint8Array {
  const intel = building.costSummary.intelligence;
  const lines = [
    `Expected cost: $${building.costSummary.total.toLocaleString()}`,
    '',
    ...(intel
      ? [
          '--- COST SCENARIOS ---',
          `Best case: $${intel.scenarios.bestCase.toLocaleString()}`,
          `Worst case: $${intel.scenarios.worstCase.toLocaleString()}`,
          `Median: $${intel.scenarios.median.toLocaleString()}`,
          `Confidence: ${intel.confidence.score}/100`,
          `Risk: ${intel.risk.level}`,
          `Region: ${intel.regionLabel}`,
          '',
        ]
      : []),
    '--- BREAKDOWN ---',
    ...building.costSummary.items.map((item) => `  ${item.label}: $${item.amount.toLocaleString()}`),
    '',
    'Indicative estimate only — not a fixed-price quote.',
    'Engage a quantity surveyor or builder for formal pricing.',
  ];
  return buildTextPdf(`${building.manifest.name} — Cost Estimate`, lines);
}

function buildElevationsPlaceholderPdf(building: GeneratedBuilding): Uint8Array {
  return buildTextPdf(`${building.manifest.name} — Elevations`, [
    'Elevation drawings — placeholder',
    '',
    'Open the project in Vishvakarma.OS editor for live 3D views.',
    'Formal elevation sheets will be included in a future release.',
    '',
    `Concept: ${building.conceptDesign.styleSummary}`,
    building.conceptDesign.designIntent,
  ]);
}

export interface PermitPackageResult {
  allowed: boolean;
  reason?: string;
  blob?: Blob;
}

export async function buildPermitPackageZip(building: GeneratedBuilding): Promise<PermitPackageResult> {
  if (!isExportAllowed(building.complianceReport)) {
    return {
      allowed: false,
      reason: 'Permit package export blocked due to compliance failures. Resolve critical issues first.',
    };
  }

  const zip = new JSZip();
  zip.file('01-cover-sheet.pdf', toZipBinary(buildCoverSheetPdf(building)));
  zip.file('02-site-plan.pdf', toZipBinary(buildSitePlanTextPdf(building)));
  zip.file('03-floor-plan.pdf', toZipBinary(exportManifestToPdfBytes(building.manifest)));
  zip.file('04-elevations-placeholder.pdf', toZipBinary(buildElevationsPlaceholderPdf(building)));
  zip.file('05-schedules.pdf', toZipBinary(buildSchedulesPdf(building)));
  zip.file('06-material-list.pdf', toZipBinary(buildMaterialListPdf(building)));
  zip.file('07-cost-estimate.pdf', toZipBinary(buildCostEstimatePdf(building)));
  zip.file('08-compliance-report.pdf', toZipBinary(buildComplianceReportPdfBytes(building.complianceReport)));
  zip.file('manifest.json', JSON.stringify(building.manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  return { allowed: true, blob };
}

export async function downloadPermitPackage(building: GeneratedBuilding): Promise<PermitPackageResult> {
  const result = await buildPermitPackageZip(building);
  if (!result.allowed || !result.blob) return result;

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${building.manifest.name.replace(/\s+/g, '-').toLowerCase()}-permit-package.zip`;
  link.click();
  URL.revokeObjectURL(url);
  return result;
}
