import type {
  AuditLog,
  ChangeRequest,
  RegistryEntry,
  Release,
  RouteManifestEntry,
  Spec,
} from '@/types';
import {
  mapAuditLogRow,
  mapChangeRequestRow,
  mapRegistryRow,
  mapReleaseRow,
  mapRouteManifestRow,
  mapSpecRow,
} from '@/backend/supabase/mappers';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

// P2: All list queries now use server-side ordering and a safety limit so the
// client never receives an unbounded result set. Filtered variants push the
// predicate to the database with .eq() instead of fetching all rows and
// filtering in JavaScript — this is O(index) on the DB vs O(n) on the client.

const DEFAULT_LIST_LIMIT = 200;

// ─── Specs ────────────────────────────────────────────────────────────────────

export async function getSupabaseSpecs(): Promise<Spec[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('specs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapSpecRow(row as Record<string, unknown>));
}

// Previously: fetched ALL specs then filtered in JS. Now: single DB query.
export async function getSupabaseSpecsByCategory(category: string): Promise<Spec[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('specs')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapSpecRow(row as Record<string, unknown>));
}

export async function createSupabaseSpec(
  spec: Omit<Spec, 'id' | 'created_at' | 'updated_at'>
): Promise<Spec> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('specs')
    .insert({ ...spec, created_at: now, updated_at: now })
    .select('*')
    .single();

  if (error) throw error;
  return mapSpecRow(data as Record<string, unknown>);
}

export async function updateSupabaseSpec(
  id: string,
  updates: Partial<Omit<Spec, 'id' | 'created_at' | 'updated_at'>>
): Promise<Spec> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client
    .from('specs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapSpecRow(data as Record<string, unknown>);
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export async function getSupabaseRegistryEntries(): Promise<RegistryEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('registry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapRegistryRow(row as Record<string, unknown>));
}

// Previously: fetched ALL registry entries then filtered in JS. Now: single DB query.
export async function getSupabaseRegistryByType(type: string): Promise<RegistryEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('registry')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapRegistryRow(row as Record<string, unknown>));
}

export async function createSupabaseRegistryEntry(
  entry: Omit<RegistryEntry, 'id' | 'created_at'>
): Promise<RegistryEntry> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client.from('registry').insert(entry).select('*').single();
  if (error) throw error;
  return mapRegistryRow(data as Record<string, unknown>);
}

// ─── Change Requests ──────────────────────────────────────────────────────────

export async function getSupabaseChangeRequests(): Promise<ChangeRequest[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('change_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapChangeRequestRow(row as Record<string, unknown>));
}

// Previously: fetched ALL change requests then filtered in JS. Now: single DB query.
export async function getSupabaseChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('change_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapChangeRequestRow(row as Record<string, unknown>));
}

export async function createSupabaseChangeRequest(
  request: Omit<ChangeRequest, 'id' | 'created_at' | 'reviewed_at' | 'implemented_at'>
): Promise<ChangeRequest> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client.from('change_requests').insert(request).select('*').single();
  if (error) throw error;
  return mapChangeRequestRow(data as Record<string, unknown>);
}

export async function updateSupabaseChangeRequest(
  id: string,
  updates: Partial<Omit<ChangeRequest, 'id' | 'created_at'>>
): Promise<ChangeRequest> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const updateData: Record<string, unknown> = { ...updates };
  if (updates.status === 'approved' || updates.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString();
  }
  if (updates.status === 'implemented') {
    updateData.implemented_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('change_requests')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapChangeRequestRow(data as Record<string, unknown>);
}

// ─── Releases ─────────────────────────────────────────────────────────────────

export async function getSupabaseReleases(): Promise<Release[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapReleaseRow(row as Record<string, unknown>));
}

export async function getSupabaseRelease(id: string): Promise<Release | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('releases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapReleaseRow(data as Record<string, unknown>);
}

export async function createSupabaseRelease(
  release: Omit<Release, 'id' | 'created_at' | 'released_at'>
): Promise<Release> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client.from('releases').insert(release).select('*').single();
  if (error) throw error;
  return mapReleaseRow(data as Record<string, unknown>);
}

export async function updateSupabaseRelease(
  id: string,
  updates: Partial<Omit<Release, 'id' | 'created_at'>>
): Promise<Release> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const updateData: Record<string, unknown> = { ...updates };
  if (updates.status === 'released') {
    updateData.released_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('releases')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapReleaseRow(data as Record<string, unknown>);
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getSupabaseAuditLogs(limit = 100): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapAuditLogRow(row as Record<string, unknown>));
}

// Previously: fetched 500 audit logs then filtered in JS by entity type + id.
// Now: two-column DB filter — O(index) instead of O(500).
export async function getSupabaseAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []).map((row) => mapAuditLogRow(row as Record<string, unknown>));
}

export async function createSupabaseAuditLog(
  action: string,
  entityType: AuditLog['entity_type'],
  entityId: string | undefined,
  details: Record<string, unknown>
): Promise<AuditLog> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('audit_logs')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details,
      timestamp: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapAuditLogRow(data as Record<string, unknown>);
}

// ─── Route Manifest ───────────────────────────────────────────────────────────

export async function getSupabaseRouteManifest(): Promise<RouteManifestEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('route_manifest')
    .select('*')
    .eq('visible', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRouteManifestRow(row as Record<string, unknown>));
}
