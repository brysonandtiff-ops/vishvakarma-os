import { backendStatus } from '@/backend/backendConfig';
import { APP_VERSION } from '@/config/appVersion';
import {
  createSupabaseAuditLog,
  createSupabaseChangeRequest,
  createSupabaseRegistryEntry,
  createSupabaseRelease,
  createSupabaseSpec,
  getSupabaseAuditLogs,
  getSupabaseAuditLogsByEntity,
  getSupabaseChangeRequests,
  getSupabaseChangeRequestsByStatus,
  getSupabaseRegistryByType,
  getSupabaseRegistryEntries,
  getSupabaseRelease,
  getSupabaseReleases,
  getSupabaseRouteManifest,
  getSupabaseSpecs,
  getSupabaseSpecsByCategory,
  updateSupabaseChangeRequest,
  updateSupabaseRelease,
  updateSupabaseSpec,
} from '@/backend/supabase/supabaseGovernanceGateway';
import {
  createSupabaseOptimizationBatch,
  getSupabaseOptimizationBatches,
  linkSupabaseOptimizationBatchToProject,
} from '@/backend/supabase/supabaseOptimizationGateway';
import {
  createSupabaseProject,
  deleteSupabaseProject,
  getSupabaseProject,
  getSupabaseProjects,
  updateSupabaseProject,
} from '@/backend/supabase/supabaseProjectGateway';
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
    throw new Error(backendStatus.configurationError ?? 'Backend is not configured.');
  }
}

async function withBackendTimeout<T>(
  operation: Promise<T>,
  label: string,
  timeoutMs = 6000,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseProjects(), 'Projects load');
}

export async function getProject(id: string): Promise<Project | null> {
  if (!backendStatus.isConfigured) return null;
  return withBackendTimeout(getSupabaseProject(id), 'Project load');
}

export async function createProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  assertConfigured();
  const data = await createSupabaseProject(name, description, manifest);
  await createAuditLog('project_created', 'project', data.id, { name, description });
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>
): Promise<Project> {
  assertConfigured();
  const data = await updateSupabaseProject(id, updates);
  await createAuditLog('project_updated', 'project', id, updates);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  assertConfigured();
  await deleteSupabaseProject(id);
  await createAuditLog('project_deleted', 'project', id, {});
}

// ============================================================================
// OPTIMIZATION BATCHES
// ============================================================================

export async function saveOptimizationBatch(
  batch: OptimizationBatch,
): Promise<OptimizationBatchRecord> {
  if (backendStatus.isConfigured) {
    return createSupabaseOptimizationBatch(batch);
  }
  return saveOptimizationBatchLocally(batch);
}

export async function getOptimizationBatches(limit = 20): Promise<OptimizationBatchRecord[]> {
  if (backendStatus.isConfigured) {
    try {
      return await withBackendTimeout(
        getSupabaseOptimizationBatches(limit),
        'Optimization history load',
      );
    } catch (error) {
      console.warn('[Vishvakarma.OS] Optimization history fell back to local cache:', error);
      return getOptimizationBatchHistoryLocally(limit);
    }
  }
  return getOptimizationBatchHistoryLocally(limit);
}

export async function linkOptimizationBatchToProject(
  batchId: string,
  projectId: string,
  details: Record<string, unknown> = {},
): Promise<OptimizationBatchRecord | null> {
  if (backendStatus.isConfigured) {
    const record = await linkSupabaseOptimizationBatchToProject(batchId, projectId);
    await createAuditLog('optimization_winner_promoted', 'optimization_batch', batchId, {
      projectId,
      ...details,
    });
    return record;
  }

  return linkOptimizationBatchToProjectLocally(batchId, projectId);
}

// ============================================================================
// SPECS
// ============================================================================

export async function getSpecs(): Promise<Spec[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseSpecs(), 'Spec Center load');
}

export async function getSpecsByCategory(category: string): Promise<Spec[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseSpecsByCategory(category), 'Spec category load');
}

export async function createSpec(spec: Omit<Spec, 'id' | 'created_at' | 'updated_at'>): Promise<Spec> {
  assertConfigured();
  const data = await createSupabaseSpec(spec);
  await createAuditLog('spec_created', 'spec', data.id, { title: spec.name });
  return data;
}

export async function updateSpec(
  id: string,
  updates: Partial<Omit<Spec, 'id' | 'created_at' | 'updated_at'>>
): Promise<Spec> {
  assertConfigured();
  const data = await updateSupabaseSpec(id, updates);
  await createAuditLog('spec_updated', 'spec', id, updates);
  return data;
}

// ============================================================================
// REGISTRY
// ============================================================================

export async function getRegistryEntries(): Promise<RegistryEntry[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseRegistryEntries(), 'Registry load');
}

export async function getRegistryByType(type: string): Promise<RegistryEntry[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseRegistryByType(type), 'Registry type load');
}

export async function createRegistryEntry(
  entry: Omit<RegistryEntry, 'id' | 'created_at'>
): Promise<RegistryEntry> {
  assertConfigured();
  const data = await createSupabaseRegistryEntry(entry);
  await createAuditLog('registry_entry_created', 'registry', data.id, { name: entry.name });
  return data;
}

// ============================================================================
// CHANGE REQUESTS
// ============================================================================

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseChangeRequests(), 'Change requests load');
}

export async function getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseChangeRequestsByStatus(status), 'Change requests by status load');
}

export async function createChangeRequest(
  request: Omit<ChangeRequest, 'id' | 'created_at' | 'reviewed_at' | 'implemented_at'>
): Promise<ChangeRequest> {
  assertConfigured();
  const data = await createSupabaseChangeRequest(request);
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
  const data = await updateSupabaseChangeRequest(id, updates);

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
    const rows = await withBackendTimeout(getSupabaseReleases(), 'Releases load');
    return rows.length > 0 ? rows : getLocalReleaseHistory();
  } catch {
    return getLocalReleaseHistory();
  }
}

function getLocalReleaseHistory(): Release[] {
  return [
    {
      id: 'local-v1-5-0',
      version: APP_VERSION,
      title: 'Governance & Editor Polish',
      description:
        'Orthogonal wall draw lock, stacked multi-floor 3D preview, DXF LWPOLYLINE import, NBC stub rules, and collaboration preview handoff.',
      change_requests: [],
      status: 'released',
      released_at: '2026-06-14T00:00:00.000Z',
      created_at: '2026-06-10T00:00:00.000Z',
    },
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
  return withBackendTimeout(getSupabaseRelease(id), 'Release load');
}

export async function createRelease(
  release: Omit<Release, 'id' | 'created_at' | 'released_at'>
): Promise<Release> {
  assertConfigured();
  const data = await createSupabaseRelease(release);
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
  return updateSupabaseRelease(id, updates);
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseAuditLogs(limit), 'Audit logs load');
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  if (!backendStatus.isConfigured) return [];
  return withBackendTimeout(getSupabaseAuditLogsByEntity(entityType, entityId), 'Audit logs by entity load');
}

export async function createAuditLog(
  action: string,
  entityType: AuditLog['entity_type'],
  entityId: string | undefined,
  details: Record<string, unknown>
): Promise<AuditLog | null> {
  if (!backendStatus.isConfigured) return null;

  try {
    return await createSupabaseAuditLog(action, entityType, entityId, details);
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
  return withBackendTimeout(getSupabaseRouteManifest(), 'Route manifest load');
}
