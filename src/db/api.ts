// API layer for Supabase database operations
import { supabase } from './supabase';
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

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      description: description || null,
      manifest,
    })
    .select()
    .single();

  if (error) throw error;

  // Create audit log
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
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog('project_updated', 'project', id, updates);

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw error;

  await createAuditLog('project_deleted', 'project', id, {});
}

// ============================================================================
// SPECS
// ============================================================================

export async function getSpecs(): Promise<Spec[]> {
  const { data, error } = await supabase
    .from('specs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getSpecsByCategory(category: string): Promise<Spec[]> {
  const { data, error } = await supabase
    .from('specs')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createSpec(spec: Omit<Spec, 'id' | 'created_at' | 'updated_at'>): Promise<Spec> {
  const { data, error } = await supabase
    .from('specs')
    .insert(spec)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog('spec_created', 'spec', data.id, { title: spec.name });

  return data;
}

export async function updateSpec(
  id: string,
  updates: Partial<Omit<Spec, 'id' | 'created_at' | 'updated_at'>>
): Promise<Spec> {
  const { data, error } = await supabase
    .from('specs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog('spec_updated', 'spec', id, updates);

  return data;
}

// ============================================================================
// REGISTRY
// ============================================================================

export async function getRegistryEntries(): Promise<RegistryEntry[]> {
  const { data, error } = await supabase
    .from('registry')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getRegistryByType(type: string): Promise<RegistryEntry[]> {
  const { data, error } = await supabase
    .from('registry')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createRegistryEntry(
  entry: Omit<RegistryEntry, 'id' | 'created_at'>
): Promise<RegistryEntry> {
  const { data, error } = await supabase
    .from('registry')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog('registry_entry_created', 'registry', data.id, { name: entry.name });

  return data;
}

// ============================================================================
// CHANGE REQUESTS
// ============================================================================

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createChangeRequest(
  request: Omit<ChangeRequest, 'id' | 'created_at' | 'reviewed_at' | 'implemented_at'>
): Promise<ChangeRequest> {
  const { data, error } = await supabase
    .from('change_requests')
    .insert(request)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog('change_request_created', 'change_request', data.id, {
    title: request.title,
  });

  return data;
}

export async function updateChangeRequest(
  id: string,
  updates: Partial<Omit<ChangeRequest, 'id' | 'created_at'>>
): Promise<ChangeRequest> {
  const updateData: Record<string, unknown> = { ...updates };

  if (updates.status === 'approved' || updates.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString();
  }
  if (updates.status === 'implemented') {
    updateData.implemented_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('change_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (updates.status === 'approved') {
    await createAuditLog('change_request_accepted', 'change_request', id, updates);
  }

  return data;
}

// ============================================================================
// RELEASES
// ============================================================================

export async function getReleases(): Promise<Release[]> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getRelease(id: string): Promise<Release | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createRelease(
  release: Omit<Release, 'id' | 'created_at' | 'released_at'>
): Promise<Release> {
  const { data, error } = await supabase
    .from('releases')
    .insert(release)
    .select()
    .single();

  if (error) throw error;

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
  const updateData: Record<string, unknown> = { ...updates };

  if (updates.status === 'released') {
    updateData.released_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('releases')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string | undefined,
  details: Record<string, unknown>
): Promise<AuditLog> {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// ROUTE MANIFEST
// ============================================================================

export async function getRouteManifest(): Promise<RouteManifestEntry[]> {
  const { data, error } = await supabase
    .from('route_manifest')
    .select('*')
    .eq('visible', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
