import type { OptimizationBatch, OptimizationBatchRecord } from '@/domain/optimization/types';
import { buildOptimizationBatchRecord } from '@/backend/firebase/firestoreOptimizationGateway';

const BATCH_HISTORY_KEY = 'optimization-batch-history';
const MAX_LOCAL_HISTORY = 20;

function readLocalHistory(): OptimizationBatchRecord[] {
  try {
    const stored = localStorage.getItem(BATCH_HISTORY_KEY);
    return stored ? (JSON.parse(stored) as OptimizationBatchRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(records: OptimizationBatchRecord[]) {
  localStorage.setItem(BATCH_HISTORY_KEY, JSON.stringify(records.slice(0, MAX_LOCAL_HISTORY)));
}

export function saveOptimizationBatchLocally(batch: OptimizationBatch): OptimizationBatchRecord {
  const record = buildOptimizationBatchRecord(batch);
  const history = readLocalHistory().filter((item) => item.id !== record.id);
  writeLocalHistory([record, ...history]);
  return record;
}

export function getOptimizationBatchHistoryLocally(limit = 20): OptimizationBatchRecord[] {
  return readLocalHistory().slice(0, limit);
}

export function linkOptimizationBatchToProjectLocally(
  batchId: string,
  projectId: string,
): OptimizationBatchRecord | null {
  const history = readLocalHistory();
  const index = history.findIndex((item) => item.id === batchId);
  if (index < 0) return null;

  const updated = { ...history[index], promotedProjectId: projectId };
  history[index] = updated;
  writeLocalHistory(history);
  return updated;
}
