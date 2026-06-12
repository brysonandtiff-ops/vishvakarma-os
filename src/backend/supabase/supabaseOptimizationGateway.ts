import type { OptimizationBatch, OptimizationBatchRecord } from '@/domain/optimization/types';
import { readSupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

function buildOptimizationBatchRecord(batch: OptimizationBatch, userId: string): OptimizationBatchRecord {
  return {
    id: batch.id,
    userId,
    input: {
      prompt: batch.input.prompt,
      targetBudget: batch.input.targetBudget,
      lifestyleGoals: batch.input.lifestyleGoals,
      sessionId: batch.input.sessionId,
    },
    winnerId: batch.winnerId,
    moatGain: batch.report.moatGain,
    candidateSummaries: batch.candidates.map((candidate) => {
      const intel = candidate.building.costSummary.intelligence;
      return {
        id: candidate.id,
        label: candidate.label,
        overallScore: candidate.overallScore,
        rank: candidate.rank,
        estimatedCost: candidate.building.costSummary.total,
        costBestCase: intel?.scenarios.bestCase,
        costWorstCase: intel?.scenarios.worstCase,
        costMedian: intel?.scenarios.median,
        costConfidence: intel?.confidence.score,
        costRiskLevel: intel?.risk.level,
        permitReady: !candidate.building.complianceReport.blocked,
      };
    }),
    createdAt: batch.createdAt,
  };
}

export async function createSupabaseOptimizationBatch(
  batch: OptimizationBatch
): Promise<OptimizationBatchRecord> {
  const client = getSupabaseClient();
  const userId = readSupabaseSessionSnapshot()?.uid;
  if (!client || !userId) throw new Error('Supabase session is not available.');

  const record = buildOptimizationBatchRecord(batch, userId);
  const { error } = await client.from('optimization_batches').insert({
    id: record.id,
    user_id: userId,
    batch: record,
    created_at: record.createdAt,
  });

  if (error) throw error;
  return record;
}

export async function getSupabaseOptimizationBatches(
  limit = 20
): Promise<OptimizationBatchRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('optimization_batches')
    .select('batch')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? [])
    .map((row) => row.batch as OptimizationBatchRecord)
    .filter(Boolean);
}

export async function linkSupabaseOptimizationBatchToProject(
  batchId: string,
  projectId: string
): Promise<OptimizationBatchRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('optimization_batches')
    .update({ project_id: projectId })
    .eq('id', batchId)
    .select('batch')
    .maybeSingle();

  if (error) throw error;
  return (data?.batch as OptimizationBatchRecord) ?? null;
}
