import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AIDesignerResultsPanel, { type ResultTab } from '@/components/editor/ai-designer/AIDesignerResultsPanel';
import CopilotReviewStep from '@/components/editor/ai-designer/CopilotReviewStep';
import CopilotUploadStep from '@/components/editor/ai-designer/CopilotUploadStep';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type {
  CopilotDocumentKind,
  CopilotIngestionResult,
  CopilotSession,
  CopilotUploadedDocument,
} from '@/domain/copilot/copilotSession';
import { createCopilotSession } from '@/domain/copilot/copilotSession';
import { generateFromCopilotSession } from '@/modules/ai-designer/buildingDesignerModule';
import { mergeCopilotRequirements } from '@/services/copilot/ingestion/requirementMerger';
import { ingestCopilotDocuments } from '@/services/copilot/ingestion/documentParsers';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { downloadComplianceReportPdf } from '@/modules/compliance/complianceReportExport';
import { downloadPermitPackage } from '@/modules/permit/permitPackageExport';
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';
import type { Project, ProjectManifest } from '@/types';

const STAGE_LABELS: Record<PipelineStage, string> = {
  ingesting: 'Ingesting site documents…',
  extracting: 'Extracting requirements…',
  constraints: 'Applying constraints…',
  concept: 'Generating concept design…',
  layout: 'Solving room layout…',
  floorplan: 'Generating floor plan…',
  schedules: 'Building schedules…',
  compliance: 'Running compliance audit…',
  complete: 'Complete',
  error: 'Error',
};

type WizardStep = 'upload' | 'review' | 'generate' | 'deliverables';

const RESULT_TABS: { key: ResultTab; label: string }[] = [
  { key: 'concept', label: 'Concept' },
  { key: 'site', label: 'Site' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'map', label: 'Map' },
  { key: 'materials', label: 'Materials' },
  { key: 'cost', label: 'Cost' },
  { key: 'compliance', label: 'Compliance' },
];

export default function AIDesignerDialog({
  open,
  onOpenChange,
  onOpenInEditor,
  onSaveProject,
  initialPrompt = '',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInEditor: (manifest: ProjectManifest, projectName: string) => void;
  onSaveProject?: (manifest: ProjectManifest, projectName: string) => Promise<Project | void>;
  initialPrompt?: string;
}) {
  const [session, setSession] = useState<CopilotSession>(() => createCopilotSession(initialPrompt));
  const [wizardStep, setWizardStep] = useState<WizardStep>('upload');
  const [filesById, setFilesById] = useState<Map<string, File>>(new Map());
  const [filesByKind, setFilesByKind] = useState<Map<CopilotDocumentKind, File>>(new Map());
  const [ingestion, setIngestion] = useState<CopilotIngestionResult | null>(null);
  const [previewRequest, setPreviewRequest] = useState<BuildingRequest | null>(null);
  const [parcelArea, setParcelArea] = useState('');
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exportingPermit, setExportingPermit] = useState(false);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<GeneratedBuilding | null>(null);
  const [tab, setTab] = useState<ResultTab>('concept');
  const [targetBudget, setTargetBudget] = useState('');
  const navigate = useNavigate();

  const designBrief = session.designBrief;

  const setDesignBrief = (value: string) => {
    setSession((s) => ({ ...s, designBrief: value, updatedAt: new Date().toISOString() }));
  };

  const handleUpload = (kind: CopilotDocumentKind, file: File, doc: CopilotUploadedDocument) => {
    setSession((s) => ({
      ...s,
      documents: [...s.documents.filter((d) => d.kind !== kind), doc],
      updatedAt: new Date().toISOString(),
    }));
    setFilesById((prev) => new Map(prev).set(doc.id, file));
    setFilesByKind((prev) => new Map(prev).set(kind, file));
  };

  const handleRemove = (kind: CopilotDocumentKind) => {
    setSession((s) => {
      const removed = s.documents.find((d) => d.kind === kind);
      if (removed) {
        setFilesById((prev) => {
          const next = new Map(prev);
          next.delete(removed.id);
          return next;
        });
      }
      return {
        ...s,
        documents: s.documents.filter((d) => d.kind !== kind),
        updatedAt: new Date().toISOString(),
      };
    });
    setFilesByKind((prev) => {
      const next = new Map(prev);
      next.delete(kind);
      return next;
    });
  };

  const handleParseAndReview = async () => {
    if (!designBrief.trim() && session.documents.length === 0) {
      toast.error('Add a design brief or upload site documents');
      return;
    }

    setParsing(true);
    try {
      const parsed = await ingestCopilotDocuments(session.documents, filesById, designBrief.trim());
      setIngestion(parsed);
      const merged = await mergeCopilotRequirements(designBrief.trim() || 'Modern family home', parsed);
      setPreviewRequest(merged.request);
      setParcelArea(String(merged.request.parcel.area));
      setWizardStep('review');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse documents');
    } finally {
      setParsing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    setStage('ingesting');
    setWizardStep('generate');

    try {
      const mergedIngestion = ingestion ?? { mergedPrompt: designBrief.trim() };
      const parcelOverride = parcelArea ? { area: Number(parcelArea) } : undefined;

      const { building } = await generateFromCopilotSession({
        prompt: designBrief.trim() || 'Modern family home',
        parcelOverride,
        ingestion: mergedIngestion,
        sessionId: session.id,
        uploadedDocuments: session.documents.map((d) => ({
          id: d.id,
          kind: d.kind,
          fileName: d.fileName,
        })),
        onStage: setStage,
      });

      setResult(building);
      setTab('concept');
      setWizardStep('deliverables');
      toast.success('Architecture Copilot design complete');
    } catch (error) {
      console.error(error);
      setStage('error');
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompareDesigns = () => {
    const mergedIngestion = ingestion ?? { mergedPrompt: designBrief.trim() };
    const parcelOverride = parcelArea ? { area: Number(parcelArea) } : undefined;
    onOpenChange(false);
    navigate('/optimization', {
      state: {
        batchInput: {
          prompt: designBrief.trim() || 'Modern family home',
          targetBudget: targetBudget ? Number(targetBudget) : undefined,
          parcelOverride,
          ingestion: mergedIngestion,
          sessionId: session.id,
          uploadedDocuments: session.documents.map((d) => ({
            id: d.id,
            kind: d.kind,
            fileName: d.fileName,
          })),
        },
      },
    });
  };

  const handleExportPermit = async () => {
    if (!result) return;
    setExportingPermit(true);
    try {
      const exportResult = await downloadPermitPackage(result);
      if (!exportResult.allowed) {
        toast.error(exportResult.reason ?? 'Permit export blocked');
        return;
      }
      toast.success('Permit package downloaded');
    } catch {
      toast.error('Permit package export failed');
    } finally {
      setExportingPermit(false);
    }
  };

  const projectName = result?.manifest.name ?? 'Copilot Design';

  const stepTitle = useMemo(() => {
    switch (wizardStep) {
      case 'upload':
        return 'Upload site inputs';
      case 'review':
        return 'Review parsed inputs';
      case 'generate':
        return 'Generating building';
      case 'deliverables':
        return 'Deliverables';
      default:
        return '';
    }
  }, [wizardStep]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vish-dialog-chrome max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl md:max-w-2xl">
        <DialogHeader>
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            Architecture Copilot
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Architecture Copilot
          </DialogTitle>
          <DialogDescription>
            Upload site survey, boundary plan, and council requirements — receive concept design, floor plan, 3D
            model, material list, cost estimate, compliance report, and permit package.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {(['upload', 'review', 'generate', 'deliverables'] as WizardStep[]).map((step, i) => (
            <span
              key={step}
              className={wizardStep === step ? 'text-primary' : ''}
            >
              {i + 1}. {step}
            </span>
          ))}
        </div>

        <p className="text-xs font-medium text-foreground">{stepTitle}</p>

        <div className="space-y-4">
          {(wizardStep === 'upload' || wizardStep === 'review') && (
            <div className="space-y-2">
              <Label htmlFor="copilot-brief">Design brief</Label>
              <Textarea
                id="copilot-brief"
                value={designBrief}
                onChange={(e) => setDesignBrief(e.target.value)}
                placeholder="4-bedroom modern home on 600m² corner block with double garage"
                rows={3}
                disabled={parsing || generating}
              />
            </div>
          )}

          {wizardStep === 'upload' && (
            <CopilotUploadStep
              documents={session.documents}
              filesByKind={filesByKind}
              onUpload={handleUpload}
              onRemove={handleRemove}
              disabled={parsing || generating}
            />
          )}

          {wizardStep === 'review' && ingestion && previewRequest && (
            <>
              <CopilotReviewStep
                ingestion={ingestion}
                request={previewRequest}
                parcelArea={parcelArea}
                onParcelAreaChange={setParcelArea}
              />
              <div className="space-y-2">
                <Label htmlFor="copilot-budget">Target budget (AUD, optional)</Label>
                <input
                  id="copilot-budget"
                  type="number"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  placeholder="450000"
                  disabled={generating}
                />
              </div>
            </>
          )}

          {(wizardStep === 'generate' || generating) && stage && (
            <p className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</p>
          )}

          {wizardStep === 'deliverables' && result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {RESULT_TABS.map(({ key, label }) => (
                  <Button key={key} size="sm" variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>
                    {label}
                  </Button>
                ))}
              </div>
              <AIDesignerResultsPanel building={result} tab={tab} />
              <p className="text-xs text-muted-foreground">
                {result.floorPlan.rooms.length} rooms · {result.floorPlan.walls.length} walls · $
                {result.costSummary.total.toLocaleString()} est. · Compliance {result.complianceReport.overall}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating || parsing}>
            Cancel
          </Button>

          {wizardStep === 'upload' && (
            <Button onClick={handleParseAndReview} disabled={parsing}>
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing…
                </>
              ) : (
                'Review inputs'
              )}
            </Button>
          )}

          {wizardStep === 'review' && (
            <>
              <Button variant="outline" onClick={() => setWizardStep('upload')} disabled={generating}>
                Back
              </Button>
              <Button variant="outline" onClick={handleCompareDesigns} disabled={generating} data-testid="compare-5-designs">
                Compare 5 designs
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                Generate design
              </Button>
            </>
          )}

          {wizardStep === 'deliverables' && result && (
            <>
              <Button
                variant="outline"
                onClick={() => downloadComplianceReportPdf(result.complianceReport)}
              >
                Compliance PDF
              </Button>
              <Button variant="outline" onClick={handleExportPermit} disabled={exportingPermit}>
                {exportingPermit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Permit package
                  </>
                )}
              </Button>
              {onSaveProject && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await onSaveProject(result.manifest, projectName);
                    onOpenChange(false);
                  }}
                >
                  Save project
                </Button>
              )}
              <Button
                onClick={() => {
                  onOpenInEditor(result.manifest, projectName);
                  onOpenChange(false);
                }}
              >
                Open in editor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
