import { fetchWithRetry } from '@/backend/fetchWithRetry';
import type { OptimizationBatch, OptimizationBatchRecord } from '@/domain/optimization/types';
import {
  createFirestoreDocument,
  documentToRecord,
  getCurrentOwnerId,
  getFirestoreDocument,
  listFirestoreDocuments,
  updateFirestoreDocument,
} from './firestoreRestClient';

const OPTIMIZATION_BATCHES_COLLECTION = 'optimization_batches';

export function buildOptimizationBatchRecord(batch: OptimizationBatch): OptimizationBatchRecord {
  const userId = getCurrentOwnerId() ?? 'local';

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

export async function createFirestoreOptimizationBatch(
  batch: OptimizationBatch,
): Promise<OptimizationBatchRecord> {
  const record = buildOptimizationBatchRecord(batch);
  const document = await createFirestoreDocument(
    OPTIMIZATION_BATCHES_COLLECTION,
    record.id,
    record as unknown as Record<string, unknown>,
  );
  return documentToRecord<OptimizationBatchRecord>(document);
}

export async function getFirestoreOptimizationBatches(
  limit = 20,
): Promise<OptimizationBatchRecord[]> {
  const documents = await fetchWithRetry(() =>
    listFirestoreDocuments(OPTIMIZATION_BATCHES_COLLECTION),
  );
  const ownerId = getCurrentOwnerId();

  return documents
    .map((document) => documentToRecord<OptimizationBatchRecord>(document))
    .filter((record) => !ownerId || record.userId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function linkFirestoreOptimizationBatchToProject(
  batchId: string,
  projectId: string,
): Promise<OptimizationBatchRecord> {
  const existing = await getFirestoreDocument(OPTIMIZATION_BATCHES_COLLECTION, batchId);
  if (!existing) throw new Error(`Optimization batch not found: ${batchId}`);

  const record = documentToRecord<OptimizationBatchRecord>(existing);
  const updated = { ...record, promotedProjectId: projectId };
  const document = await updateFirestoreDocument(
    OPTIMIZATION_BATCHES_COLLECTION,
    batchId,
    updated as unknown as Record<string, unknown>,
  );
  return documentToRecord<OptimizationBatchRecord>(document);
}
