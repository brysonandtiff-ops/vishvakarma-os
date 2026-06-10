import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import ArchitectureMapView from '@/components/editor/ai-designer/ArchitectureMapView';
import ComplianceReportPanel from '@/components/editor/ai-designer/ComplianceReportPanel';
import SitePlanPreview from '@/components/editor/ai-designer/SitePlanPreview';

export type ResultTab =
  | 'concept'
  | 'site'
  | 'schedules'
  | 'map'
  | 'materials'
  | 'cost'
  | 'compliance';

export default function AIDesignerResultsPanel({
  building,
  tab,
}: {
  building: GeneratedBuilding;
  tab: ResultTab;
}) {
  if (tab === 'concept') {
    return (
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
        <p className="font-semibold">{building.conceptDesign.styleSummary}</p>
        <p className="text-muted-foreground">{building.conceptDesign.designIntent}</p>
        <p className="text-xs text-muted-foreground">{building.conceptDesign.massingNotes}</p>
        <ul className="list-disc pl-4 text-xs text-muted-foreground">
          {building.conceptDesign.adjacencyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === 'site') {
    return <SitePlanPreview sitePlan={building.sitePlan} />;
  }

  if (tab === 'map') {
    return <ArchitectureMapView graph={building.architectureMap} />;
  }

  if (tab === 'compliance') {
    return <ComplianceReportPanel report={building.complianceReport} />;
  }

  if (tab === 'materials') {
    return (
      <div className="max-h-56 overflow-auto rounded-xl border border-border/60 text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              <th className="px-2 py-1 text-left">Item</th>
              <th className="px-2 py-1 text-left">Category</th>
              <th className="px-2 py-1 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {building.materialList.map((row) => (
              <tr key={row.id} className="border-t border-border/40">
                <td className="px-2 py-1">{row.item}</td>
                <td className="px-2 py-1 text-muted-foreground">{row.category}</td>
                <td className="px-2 py-1 text-right">
                  {row.quantity} {row.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'cost') {
    return (
      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
        <p className="font-semibold">Estimated total: ${building.costSummary.total.toLocaleString()}</p>
        <ul className="space-y-1 text-muted-foreground">
          {building.costSummary.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>{item.label}</span>
              <span>${item.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-h-56 overflow-auto rounded-xl border border-border/60 text-xs">
      <table className="w-full">
        <thead className="sticky top-0 bg-muted/80">
          <tr>
            <th className="px-2 py-1 text-left">Room</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-right">Area m²</th>
          </tr>
        </thead>
        <tbody>
          {building.schedules.rooms.map((row) => (
            <tr key={row.id} className="border-t border-border/40">
              <td className="px-2 py-1">{row.name}</td>
              <td className="px-2 py-1 text-muted-foreground">{row.type}</td>
              <td className="px-2 py-1 text-right">{row.areaSqM.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border/40 px-2 py-2 text-muted-foreground">
        {building.schedules.walls.length} walls · {building.schedules.windows.length} windows
      </p>
    </div>
  );
}
