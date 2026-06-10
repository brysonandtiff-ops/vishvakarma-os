// API layer for Vishvakarma.OS database operations (Firebase Firestore)
import { backendStatus } from '@/backend/backendConfig';
import {
  createFirestoreAuditLog,
  createFirestoreChangeRequest,
  createFirestoreRegistryEntry,
  createFirestoreRelease,
  createFirestoreSpec,
  getFirestoreAuditLogs,
  getFirestoreAuditLogsByEntity,
  getFirestoreChangeRequests,
  getFirestoreChangeRequestsByStatus,
  getFirestoreRegistryByType,
  getFirestoreRegistryEntries,
  getFirestoreRelease,
  getFirestoreReleases,
  getFirestoreRouteManifest,
  getFirestoreSpecs,
  getFirestoreSpecsByCategory,
  updateFirestoreChangeRequest,
  updateFirestoreRelease,
  updateFirestoreSpec,
} from '@/backend/firebase/firestoreGovernanceGateway';
import {
  createFirestoreOptimizationBatch,
  getFirestoreOptimizationBatches,
  linkFirestoreOptimizationBatchToProject,
} from '@/backend/firebase/firestoreOptimizationGateway';
import {
  createFirestoreProject,
  deleteFirestoreProject,
  getFirestoreProject,
  getFirestoreProjects,
  updateFirestoreProject,
} from '@/backend/firebase/firestoreProjectGateway';
import type { OptimizationBatch, OptimizationBatchRecord } from '@/domain/optimization/types';
import {
  getOptimizationBatchHistoryLocally,
  linkOptimizationBatchToProjectLocally,
  saveOptimizationBatchLocally,
} from '@/services/optimization/optimizationBatchStorage';
import type {
  Project,
  Spec,
  RegistryEntry,
  ChangeRequest,
  Release,
  AuditLog,
  RouteManifestEntry,
  ProjectManifest,
} from '@/types';

function assertConfigured() {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  if (!backendStatus.isConfigured) {
    return [];
  }

  return getFirestoreProjects();
}

export async function getProject(id: string): Promise<Project | null> {
  if (!backendStatus.isConfigured) {
    return null;
  }

  return getFirestoreProject(id);
}

export async function createProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  assertConfigured();
  const data = await createFirestoreProject(name, description, manifest);

  await createAuditLog('project_created', 'project', data.id, {
    name,
    description,
  });

  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>
): Promise<Project> {
  assertConfigured();
  const data = await updateFirestoreProject(id, updates);

  await createAuditLog('project_updated', 'project', id, updates);

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  assertConfigured();
  await deleteFirestoreProject(id);
  await createAuditLog('project_deleted', 'project', id, {});
}

// ============================================================================
// OPTIMIZATION BATCHES
// ============================================================================

export async function saveOptimizationBatch(
  batch: OptimizationBatch,
): Promise<OptimizationBatchRecord> {
  if (backendStatus.isConfigured) {
    return createFirestoreOptimizationBatch(batch);
  }
  return saveOptimizationBatchLocally(batch);
}

export async function getOptimizationBatches(limit = 20): Promise<OptimizationBatchRecord[]> {
  if (backendStatus.isConfigured) {
    return getFirestoreOptimizationBatches(limit);
  }
  return getOptimizationBatchHistoryLocally(limit);
}

export async function linkOptimizationBatchToProject(
  batchId: string,
  projectId: string,
  details: Record<string, unknown> = {},
): Promise<OptimizationBatchRecord | null> {
  if (backendStatus.isConfigured) {
    const record = await linkFirestoreOptimizationBatchToProject(batchId, projectId);
    await createAuditLog('optimization_winner_promoted', 'optimization_batch', batchId, {
      projectId,
      ...details,
    });
    return record;
  }

  const record = linkOptimizationBatchToProjectLocally(batchId, projectId);
  return record;
}

// ============================================================================
// SPECS
// ============================================================================

export async function getSpecs(): Promise<Spec[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreSpecs();
}

export async function getSpecsByCategory(category: string): Promise<Spec[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreSpecsByCategory(category);
}

export async function createSpec(spec: Omit<Spec, 'id' | 'created_at' | 'updated_at'>): Promise<Spec> {
  assertConfigured();
  const data = await createFirestoreSpec(spec);
  await createAuditLog('spec_created', 'spec', data.id, { title: spec.name });
  return data;
}

export async function updateSpec(
  id: string,
  updates: Partial<Omit<Spec, 'id' | 'created_at' | 'updated_at'>>
): Promise<Spec> {
  assertConfigured();
  const data = await updateFirestoreSpec(id, updates);
  await createAuditLog('spec_updated', 'spec', id, updates);
  return data;
}

// ============================================================================
// REGISTRY
// ============================================================================

export async function getRegistryEntries(): Promise<RegistryEntry[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreRegistryEntries();
}

export async function getRegistryByType(type: string): Promise<RegistryEntry[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreRegistryByType(type);
}

export async function createRegistryEntry(
  entry: Omit<RegistryEntry, 'id' | 'created_at'>
): Promise<RegistryEntry> {
  assertConfigured();
  const data = await createFirestoreRegistryEntry(entry);
  await createAuditLog('registry_entry_created', 'registry', data.id, { name: entry.name });
  return data;
}

// ============================================================================
// CHANGE REQUESTS
// ============================================================================

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreChangeRequests();
}

export async function getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreChangeRequestsByStatus(status);
}

export async function createChangeRequest(
  request: Omit<ChangeRequest, 'id' | 'created_at' | 'reviewed_at' | 'implemented_at'>
): Promise<ChangeRequest> {
  assertConfigured();
  const data = await createFirestoreChangeRequest(request);
  await createAuditLog('change_request_created', 'change_request', data.id, {
    title: request.title,
  });
  return data;
}

export async function updateChangeRequest(
  id: string,
  updates: Partial<Omit<ChangeRequest, 'id' | 'created_at'>>
): Promise<ChangeRequest> {
  assertConfigured();
  const data = await updateFirestoreChangeRequest(id, updates);

  if (updates.status === 'approved') {
    await createAuditLog('change_request_accepted', 'change_request', id, updates);
  }

  return data;
}

// ============================================================================
// RELEASES
// ============================================================================

export async function getReleases(): Promise<Release[]> {
  if (!backendStatus.isConfigured) {
    return getLocalReleaseHistory();
  }

  try {
    const rows = await getFirestoreReleases();
    return rows.length > 0 ? rows : getLocalReleaseHistory();
  } catch {
    return getLocalReleaseHistory();
  }
}

function getLocalReleaseHistory(): Release[] {
  return [
    {
      id: 'local-v1-0-0',
      version: 'v1.0.0',
      title: 'Blueprint Editor GA',
      description: 'Initial production release — 2D canvas, 3D viewport, extended ToolRail, governance gates.',
      change_requests: [],
      status: 'released',
      released_at: '2026-05-01T00:00:00.000Z',
      created_at: '2026-04-15T00:00:00.000Z',
    },
    {
      id: 'local-v0-9-0',
      version: 'v0.9.0',
      title: 'iPad Workspace Preview',
      description: 'Immersive editor shell, local draft recovery, release gate manifest.',
      change_requests: [],
      status: 'released',
      released_at: '2026-03-01T00:00:00.000Z',
      created_at: '2026-02-20T00:00:00.000Z',
    },
  ];
}

export async function getRelease(id: string): Promise<Release | null> {
  if (!backendStatus.isConfigured) return null;
  return getFirestoreRelease(id);
}

export async function createRelease(
  release: Omit<Release, 'id' | 'created_at' | 'released_at'>
): Promise<Release> {
  assertConfigured();
  const data = await createFirestoreRelease(release);
  await createAuditLog('release_created', 'release', data.id, {
    version: release.version,
    title: release.title,
  });
  return data;
}

export async function updateRelease(
  id: string,
  updates: Partial<Omit<Release, 'id' | 'created_at'>>
): Promise<Release> {
  assertConfigured();
  return updateFirestoreRelease(id, updates);
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreAuditLogs(limit);
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  if (!backendStatus.isConfigured) return [];
  return getFirestoreAuditLogsByEntity(entityType, entityId);
}

export async function createAuditLog(
  action: string,
  entityType: AuditLog['entity_type'],
  entityId: string | undefined,
  details: Record<string, unknown>
): Promise<AuditLog | null> {
  if (!backendStatus.isConfigured) return null;

  try {
    return await createFirestoreAuditLog(action, entityType, entityId, details);
  } catch (error) {
    console.warn('[Vishvakarma.OS] Audit log write skipped:', error);
    return null;
  }
}

// ============================================================================
// ROUTE MANIFEST
// ============================================================================

export async function getRouteManifest(): Promise<RouteManifestEntry[]> {
  if (!backendStatus.isConfigured) return [];

  try {
    return await getFirestoreRouteManifest();
  } catch {
    return [];
  }
}
