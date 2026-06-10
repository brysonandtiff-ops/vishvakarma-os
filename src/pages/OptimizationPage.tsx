import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
import OptimizationBatchHistory from '@/components/optimization/OptimizationBatchHistory';
import OptimizationDashboard from '@/components/optimization/OptimizationDashboard';
import OptimizationIntakeForm, {
  type OptimizationIntakeValues,
} from '@/components/optimization/OptimizationIntakeForm';
import { backendStatus } from '@/backend/backendConfig';
import type { OptimizationBatch, OptimizationBatchInput, OptimizationBatchRecord } from '@/domain/optimization/types';
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
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';
import { toast } from 'sonner';

const FAVORITES_KEY = 'optimization-favorites';

interface OptimizationLocationState {
  batchInput?: OptimizationBatchInput;
}

export default function OptimizationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? {}) as OptimizationLocationState;

  const [intake, setIntake] = useState<OptimizationIntakeValues>({
    prompt: locationState.batchInput?.prompt ?? '',
    targetBudget: locationState.batchInput?.targetBudget
      ? String(locationState.batchInput.targetBudget)
      : '',
    lifestyleGoals: locationState.batchInput?.lifestyleGoals?.join(', ') ?? '',
  });
  const [batch, setBatch] = useState<OptimizationBatch | null>(null);
  const [batchHistory, setBatchHistory] = useState<OptimizationBatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<PipelineStage | null>(null);
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

  const loadHistory = useCallback(async () => {
    const records = await getOptimizationBatches();
    setBatchHistory(records);
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const runBatch = useCallback(
    async (input: OptimizationBatchInput) => {
      setLoading(true);
      setBatch(null);
      setStage('extracting');
      try {
        const result = await generateOptimizationBatch(input, (_idx, s) => setStage(s));
        setBatch(result);
        setSelectedId(result.winnerId);
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

  const buildInput = useCallback(
    (values: OptimizationIntakeValues): OptimizationBatchInput => ({
      prompt: values.prompt.trim(),
      targetBudget: values.targetBudget ? Number(values.targetBudget) : undefined,
      lifestyleGoals: values.lifestyleGoals
        ? values.lifestyleGoals.split(',').map((g) => g.trim()).filter(Boolean)
        : undefined,
      ingestion: locationState.batchInput?.ingestion,
      sessionId: locationState.batchInput?.sessionId,
      uploadedDocuments: locationState.batchInput?.uploadedDocuments,
      parcelOverride: locationState.batchInput?.parcelOverride,
    }),
    [locationState.batchInput],
  );

  const handleSubmit = () => {
    void runBatch(buildInput(intake));
  };

  useEffect(() => {
    if (locationState.batchInput?.prompt) {
      void runBatch(locationState.batchInput);
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

        {!batch && !loading && (
          <OptimizationIntakeForm
            values={intake}
            onChange={setIntake}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-6" data-testid="optimization-loading">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Generating 5 design candidates…</p>
              {stage && <p className="text-sm text-muted-foreground">Stage: {stage}</p>}
            </div>
          </div>
        )}

        {batch && runnerUp && (
          <OptimizationDashboard
            batch={batch}
            selectedCandidate={selectedCandidate}
            runnerUp={runnerUp}
            favorites={favorites}
            selectedId={selectedId}
            compareId={compareId}
            saving={saving}
            onSelect={setSelectedId}
            onFavorite={toggleFavorite}
            onPromote={handlePromote}
            onCompare={(id) => setCompareId(compareId === id ? null : id)}
            onSaveProject={() => void handleSaveWinnerProject()}
            onExportPermit={() => void handleExportPermit()}
            onExportPdf={handleExportPdf}
          />
        )}
      </WorkspacePageShell>
    </AppLayout>
  );
}
