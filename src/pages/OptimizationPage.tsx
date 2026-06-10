import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
import CandidateComparisonGrid from '@/components/optimization/CandidateComparisonGrid';
import OptimizationIntakeForm, {
  type OptimizationIntakeValues,
} from '@/components/optimization/OptimizationIntakeForm';
import OptimizationReportPanel from '@/components/optimization/OptimizationReportPanel';
import ScoreBreakdownPanel from '@/components/optimization/ScoreBreakdownPanel';
import TradeoffPanel from '@/components/optimization/TradeoffPanel';
import type { OptimizationBatch, OptimizationBatchInput } from '@/domain/optimization/types';
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
  const [loading, setLoading] = useState(false);
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

  const runBatch = useCallback(async (input: OptimizationBatchInput) => {
    setLoading(true);
    setBatch(null);
    setStage('extracting');
    try {
      const result = await generateOptimizationBatch(input, (_idx, s) => setStage(s));
      setBatch(result);
      setSelectedId(result.winnerId);
      toast.success('5 design candidates generated and ranked');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Optimization failed');
    } finally {
      setLoading(false);
      setStage(null);
    }
  }, []);

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

  const compareCandidate = useMemo(
    () => batch?.candidates.find((c) => c.id === compareId) ?? null,
    [batch, compareId],
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

  return (
    <AppLayout>
      <PageMeta title="Design Optimization" description="Compare and rank AI-generated design candidates" />
      <WorkspacePageShell>
        <WorkspacePageHeader
          title="Design Battle"
          subtitle="Generate 5 strategy-driven candidates, score them, and pick the best plan for your site."
          icon={Sparkles}
        />

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

        {batch && (
          <div className="space-y-6">
            <OptimizationReportPanel batch={batch} />

            <CandidateComparisonGrid
              candidates={batch.candidates}
              winnerId={batch.winnerId}
              favorites={favorites}
              selectedId={selectedId}
              compareId={compareId}
              onSelect={setSelectedId}
              onFavorite={toggleFavorite}
              onPromote={handlePromote}
              onCompare={(id) => setCompareId(compareId === id ? null : id)}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ScoreBreakdownPanel candidate={selectedCandidate} />
              {compareCandidate && compareCandidate.id !== selectedId ? (
                <ScoreBreakdownPanel candidate={compareCandidate} />
              ) : (
                <TradeoffPanel tradeoffs={batch.report.tradeoffs} />
              )}
            </div>

            {compareCandidate && compareCandidate.id !== selectedId && (
              <TradeoffPanel tradeoffs={batch.report.tradeoffs} />
            )}
          </div>
        )}
      </WorkspacePageShell>
    </AppLayout>
  );
}
