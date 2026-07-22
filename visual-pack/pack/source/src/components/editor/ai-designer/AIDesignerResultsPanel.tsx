import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import ArchitectureMapView from '@/components/editor/ai-designer/ArchitectureMapView';
import ComplianceReportPanel from '@/components/editor/ai-designer/ComplianceReportPanel';
import PlanExplanationPanel from '@/components/editor/ai-designer/PlanExplanationPanel';
import SitePlanPreview from '@/components/editor/ai-designer/SitePlanPreview';

export type ResultTab =
  | 'concept'
  | 'site'
  | 'schedules'
  | 'map'
  | 'materials'
  | 'cost'
  | 'compliance'
  | 'whyPlan';

function formatAud(amount: number): string {
  return `AUD $${Math.round(amount).toLocaleString('en-AU')}`;
}

function buildComplianceNotes(building: GeneratedBuilding): string[] {
  const findings = building.complianceReport.results.flatMap((result) => result.findings);
  const importantFindings = findings.filter((finding) => finding.status !== 'pass').slice(0, 2);

  if (importantFindings.length > 0) {
    return importantFindings.map((finding) => finding.message);
  }

  if (building.complianceReport.disclaimer) {
    return [building.complianceReport.disclaimer];
  }

  return ['Decision-support compliance notes generated. Professional approval remains required before construction.'];
}

function CopilotProofFlow({ building }: { building: GeneratedBuilding }) {
  const request = building.request;
  const complianceNotes = buildComplianceNotes(building);
  const selectedPlan = building.planning?.selectedCandidateId ?? 'selected concept';
  const evaluatedPlans = building.planning?.candidateCount ?? building.shortlistBuildings?.length ?? 1;
  const roomCount = building.floorPlan.rooms.length;
  const wallCount = building.floorPlan.walls.length;
  const openingCount = building.floorPlan.openings.length;
  const complianceLabel = building.complianceReport.overall === 'pass'
    ? 'Decision-support pass'
    : building.complianceReport.overall === 'warning'
      ? 'Decision-support warnings'
      : 'Decision-support blockers';

  const proofCards = [
    {
      title: '1. Brief captured',
      value: `${request.bedrooms} bed · ${request.bathrooms} bath · ${request.garageSpaces} garage`,
      body: `${request.style} direction on ${request.parcel.area.toLocaleString()} m² parcel, ${request.levels} level${request.levels === 1 ? '' : 's'}.`,
    },
    {
      title: '2. Inputs reviewed',
      value: `${request.parcel.orientation} orientation`,
      body: `${request.parcel.width} m × ${request.parcel.depth} m parcel with ${request.parcel.slope}% slope assumption.`,
    },
    {
      title: '3. Concept generated',
      value: building.conceptDesign.styleSummary,
      body: `${selectedPlan} selected from ${evaluatedPlans} evaluated plan${evaluatedPlans === 1 ? '' : 's'}.`,
    },
    {
      title: '4. Cost estimate',
      value: formatAud(building.costSummary.total),
      body: building.costSummary.intelligence
        ? `${building.costSummary.intelligence.regionLabel} · ${building.costSummary.intelligence.confidence.score}% confidence · ${building.costSummary.intelligence.risk.level} risk.`
        : `${building.costSummary.items.length} estimated cost line items generated.`,
    },
    {
      title: '5. Compliance notes',
      value: complianceLabel,
      body: complianceNotes.join(' '),
    },
    {
      title: '6. Export preview',
      value: `${roomCount} rooms · ${wallCount} walls · ${openingCount} openings`,
      body: 'Ready for editor handoff, Compliance PDF, and Permit Package export preview.',
    },
  ];

  return (
    <section
      className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
      data-testid="copilot-proof-flow"
      aria-labelledby="copilot-proof-flow-title"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Proof flow</p>
        <h3 id="copilot-proof-flow-title" className="text-base font-semibold text-foreground">
          brief → review → generated concept → cost estimate → compliance notes → export preview
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          This proof strip turns the Copilot result into a reviewer-ready story. It shows what was requested, what was reviewed, what was generated, the AUD estimate, the decision-support compliance posture, and what can be exported next.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {proofCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-border bg-background/85 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{card.title}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.body}</p>
          </article>
        ))}
      </div>

      <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        Compliance and cost outputs are decision-support only. Use them for concept review and export preview, not certified approval or fixed-price construction quoting.
      </p>
    </section>
  );
}

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

  if (tab === 'whyPlan') {
    const planning = building.planning;
    return (
      <div className="space-y-3">
        <CopilotProofFlow building={building} />
        {planning?.explanation ? (
          <PlanExplanationPanel
            explanation={planning.explanation}
            rankedScores={planning.rankedScores}
            selectedId={planning.selectedCandidateId}
            candidateCount={planning.candidateCount}
          />
        ) : (
          <p className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            Planning intelligence data is not available for this design.
          </p>
        )}
      </div>
    );
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
    const intel = building.costSummary.intelligence;
    return (
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
        <p className="font-semibold">Expected: {formatAud(building.costSummary.total)}</p>
        {intel && (
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Best</p>
              <p className="font-medium">{formatAud(intel.scenarios.bestCase)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Worst</p>
              <p className="font-medium">{formatAud(intel.scenarios.worstCase)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Median</p>
              <p className="font-medium">{formatAud(intel.scenarios.median)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Confidence</p>
              <p className="font-medium">{intel.confidence.score}%</p>
            </div>
          </div>
        )}
        <ul className="space-y-1 text-muted-foreground">
          {building.costSummary.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>{item.label}</span>
              <span>{formatAud(item.amount)}</span>
            </li>
          ))}
        </ul>
        {intel && (
          <p className="text-xs text-muted-foreground">
            {intel.regionLabel} · {intel.risk.level} risk · {intel.confidence.summary}
          </p>
        )}
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
