import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
import OptimizationBatchHistory from '@/components/optimization/OptimizationBatchHistory';
import OptimizationDashboard from '@/components/optimization/OptimizationDashboard';
import ComputeOverlay from '@/components/system-intelligence/ComputeOverlay';
import ConstraintEditor, {
  type ConstraintValues,
  constraintValuesEqual,
  constraintsFromResolvedRequest,
} from '@/components/system-intelligence/ConstraintEditor';
import SystemFlowHUD from '@/components/system-intelligence/SystemFlowHUD';
import {
  pipelineStageToComputeStatus,
  pipelineStageToMacro,
  type MacroStep,
} from '@/components/system-intelligence/pipelineStageLabels';
import { backendStatus } from '@/backend/backendConfig';
import type {
  OptimizationBatch,
  OptimizationBatchInput,
  OptimizationBatchRecord,
  OptimizationRequestOverride,
} from '@/domain/optimization/types';
import { createLocalProject } from '@/editor/localProject';
import { upsertLocalProject } from '@/editor/localProjects';
import {
  createProject,
  getOptimizationBatches,
  linkOptimizationBatchToProject,
  saveOptimizationBatch,
} from '@/db/api';
import { downloadOptimizationReportPdf } from '@/modules/optimization/optimizationReportExport';
import { downloadPermitPackage } from '@/modules/permit/permitPackageExport';
import { generateOptimizationBatch } from '@/modules/optimization/optimizationModule';
import type { OptimizationProgressStage } from '@/services/optimization/optimizationOrchestrator';
import { STRATEGY_PROFILES } from '@/services/optimization/strategyProfiles';
import { toast } from 'sonner';

const FAVORITES_KEY = 'optimization-favorites';

interface OptimizationLocationState {
  batchInput?: OptimizationBatchInput;
}

function emptyConstraints(overrides?: Partial<ConstraintValues>): ConstraintValues {
  return {
    prompt: '',
    targetBudget: '',
    lifestyleGoals: '',
    bedrooms: '',
    bathrooms: '',
    garageSpaces: '',
    parcelArea: '',
    ...overrides,
  };
}

function buildInput(
  values: ConstraintValues,
  locationInput?: OptimizationBatchInput,
): OptimizationBatchInput {
  const requestOverride: OptimizationRequestOverride = {};
  if (values.bedrooms) requestOverride.bedrooms = Number(values.bedrooms);
  if (values.bathrooms) requestOverride.bathrooms = Number(values.bathrooms);
  if (values.garageSpaces) requestOverride.garageSpaces = Number(values.garageSpaces);

  return {
    prompt: values.prompt.trim(),
    targetBudget: values.targetBudget ? Number(values.targetBudget) : undefined,
    lifestyleGoals: values.lifestyleGoals
      ? values.lifestyleGoals.split(',').map((g) => g.trim()).filter(Boolean)
      : undefined,
    parcelOverride: values.parcelArea ? { area: Number(values.parcelArea) } : undefined,
    requestOverride: Object.keys(requestOverride).length > 0 ? requestOverride : undefined,
    ingestion: locationInput?.ingestion,
    sessionId: locationInput?.sessionId,
    uploadedDocuments: locationInput?.uploadedDocuments,
  };
}

export default function OptimizationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? {}) as OptimizationLocationState;

  const [constraints, setConstraints] = useState<ConstraintValues>(() =>
    emptyConstraints({
      prompt: locationState.batchInput?.prompt ?? '',
      targetBudget: locationState.batchInput?.targetBudget
        ? String(locationState.batchInput.targetBudget)
        : '',
      lifestyleGoals: locationState.batchInput?.lifestyleGoals?.join(', ') ?? '',
    }),
  );
  const [lastRunSnapshot, setLastRunSnapshot] = useState<ConstraintValues | null>(null);
  const [batch, setBatch] = useState<OptimizationBatch | null>(null);
  const [batchHistory, setBatchHistory] = useState<OptimizationBatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<OptimizationProgressStage | null>(null);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const dirty = lastRunSnapshot !== null && !constraintValuesEqual(constraints, lastRunSnapshot);

  const loadHistory = useCallback(async () => {
    const records = await getOptimizationBatches();
    setBatchHistory(records);
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const runBatch = useCallback(
    async (input: OptimizationBatchInput, runConstraints: ConstraintValues) => {
      setLoading(true);
      setBatch(null);
      setStage('extracting');
      setCandidateIndex(0);
      try {
        const result = await generateOptimizationBatch(input, (idx, s) => {
          setCandidateIndex(idx);
          setStage(s);
        });
        setBatch(result);
        setSelectedId(result.winnerId);
        const synced = constraintsFromResolvedRequest(runConstraints, result.resolvedRequest);
        setConstraints(synced);
        setLastRunSnapshot(synced);
        await saveOptimizationBatch(result);
        await loadHistory();
        toast.success('5 design candidates generated and ranked');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Optimization failed');
      } finally {
        setLoading(false);
        setStage(null);
      }
    },
    [loadHistory],
  );

  const handleRegenerate = () => {
    void runBatch(buildInput(constraints, locationState.batchInput), constraints);
  };

  useEffect(() => {
    if (locationState.batchInput?.prompt) {
      const initial = emptyConstraints({
        prompt: locationState.batchInput.prompt,
        targetBudget: locationState.batchInput.targetBudget
          ? String(locationState.batchInput.targetBudget)
          : '',
        lifestyleGoals: locationState.batchInput.lifestyleGoals?.join(', ') ?? '',
      });
      setConstraints(initial);
      void runBatch(locationState.batchInput, initial);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on copilot navigation

  const selectedCandidate = useMemo(
    () => batch?.candidates.find((c) => c.id === selectedId) ?? null,
    [batch, selectedId],
  );

  const runnerUp = useMemo(
    () => batch?.candidates.find((c) => c.id === batch.runnerUpId) ?? batch?.candidates[1],
    [batch],
  );

  const winner = useMemo(
    () => batch?.candidates.find((c) => c.id === batch?.winnerId) ?? null,
    [batch],
  );

  const candidateLabel = useMemo(() => {
    if (!loading || stage === 'scoring') return undefined;
    if (stage === 'extracting' || candidateIndex >= STRATEGY_PROFILES.length) return undefined;
    const strategy = STRATEGY_PROFILES[candidateIndex];
    return strategy
      ? `Candidate ${candidateIndex + 1}/${STRATEGY_PROFILES.length} — ${strategy.label}`
      : undefined;
  }, [loading, stage, candidateIndex]);

  const activeMacroStep: MacroStep =
    batch && !loading ? 'Export' : stage ? pipelineStageToMacro(stage) : 'Input';

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handlePromote = (candidate: OptimizationBatch['candidates'][0]) => {
    navigate('/editor', {
      state: {
        loadManifest: candidate.building.manifest,
        projectName: `${candidate.label} — ${candidate.building.manifest.name}`,
      },
    });
  };

  const handleSaveWinnerProject = async () => {
    if (!batch || !winner) return;

    setSaving(true);
    try {
      const manifest = {
        ...winner.building.manifest,
        metadata: {
          ...winner.building.manifest.metadata,
          optimization: {
            batchId: batch.id,
            candidateId: winner.id,
            objective: winner.objective,
            overallScore: winner.overallScore,
            rank: winner.rank,
            generatedAt: batch.createdAt,
            promotedAt: new Date().toISOString(),
          },
          ...(winner.building.costSummary.intelligence
            ? {
                costIntelligence: {
                  expected: winner.building.costSummary.intelligence.scenarios.expected,
                  bestCase: winner.building.costSummary.intelligence.scenarios.bestCase,
                  worstCase: winner.building.costSummary.intelligence.scenarios.worstCase,
                  confidence: winner.building.costSummary.intelligence.confidence.score,
                },
              }
            : {}),
        },
      };
      const projectName = `${winner.label} — ${manifest.name}`;

      const project = backendStatus.isConfigured
        ? await createProject(projectName, manifest.description, manifest)
        : createLocalProject(projectName, manifest.description, manifest);

      if (!backendStatus.isConfigured) {
        upsertLocalProject(project);
      }

      await linkOptimizationBatchToProject(batch.id, project.id, {
        candidateId: winner.id,
        moatGain: batch.report.moatGain,
      });
      await loadHistory();
      toast.success(`Saved winner as project: ${projectName}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPermit = async () => {
    if (!winner) return;
    const result = await downloadPermitPackage(winner.building);
    if (!result.allowed) {
      toast.error(result.reason ?? 'Permit export blocked');
    } else {
      toast.success('Permit package downloaded');
    }
  };

  const handleExportPdf = () => {
    if (!batch) return;
    downloadOptimizationReportPdf(batch);
    toast.success('Optimization report downloaded');
  };

  return (
    <AppLayout>
      <PageMeta title="Design Optimization" description="Compare and rank AI-generated design candidates" />
      <WorkspacePageShell>
        <WorkspacePageHeader
          title="Design Battle"
          description="Generate 5 strategy-driven candidates, score them, and pick the best plan for your site."
        />

        <OptimizationBatchHistory records={batchHistory} />

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ConstraintEditor
              values={constraints}
              onChange={setConstraints}
              dirty={dirty}
              loading={loading}
              onRegenerate={handleRegenerate}
            />
          </div>

          <div className="relative min-w-0 space-y-6">
            {loading && (
              <div
                className="relative space-y-4 rounded-2xl border border-border/60 p-6"
                data-testid="optimization-loading"
              >
                <ComputeOverlay
                  status={pipelineStageToComputeStatus(stage)}
                  candidateLabel={candidateLabel}
                  className="absolute right-4 top-4"
                />
                <div className="flex items-center gap-3 pr-32">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                  <p className="font-medium">Generating 5 design candidates…</p>
                </div>
                <SystemFlowHUD variant="macro" activeStep={stage ?? 'Input'} />
              </div>
            )}

            {!loading && !batch && (
              <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                Set your constraints and click Regenerate to compare 5 strategy-driven designs.
              </div>
            )}

            {batch && runnerUp && winner && (
              <OptimizationDashboard
                batch={batch}
                selectedCandidate={selectedCandidate}
                runnerUp={runnerUp}
                winner={winner}
                favorites={favorites}
                selectedId={selectedId}
                compareId={compareId}
                saving={saving}
                regenerating={loading}
                activeMacroStep={activeMacroStep}
                onSelect={setSelectedId}
                onFavorite={toggleFavorite}
                onPromote={handlePromote}
                onCompare={(id) => setCompareId(compareId === id ? null : id)}
                onSaveProject={() => void handleSaveWinnerProject()}
                onExportPermit={() => void handleExportPermit()}
                onExportPdf={handleExportPdf}
              />
            )}
          </div>
        </div>
      </WorkspacePageShell>
    </AppLayout>
  );
}
