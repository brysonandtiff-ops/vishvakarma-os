import type {
  AuditLog,
  ChangeRequest,
  RegistryEntry,
  Release,
  RouteManifestEntry,
  Spec,
} from '@/types';
import {
  createFirestoreDocument,
  documentToRecord,
  getCurrentOwnerId,
  getFirestoreDocument,
  listFirestoreDocuments,
  updateFirestoreDocument,
} from './firestoreRestClient';

function sortByCreatedAt<T extends { created_at?: string; timestamp?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aTime = a.created_at ?? a.timestamp ?? '';
    const bTime = b.created_at ?? b.timestamp ?? '';
    return bTime.localeCompare(aTime);
  });
}

function sortByTimestampDesc(rows: AuditLog[]): AuditLog[] {
  return [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function listCollection<T extends { id: string }>(collection: string): Promise<T[]> {
  const documents = await listFirestoreDocuments(collection);
  return documents.map((document) => documentToRecord<T>(document));
}

async function createRecord<T extends { id: string }>(
  collection: string,
  data: Record<string, unknown>
): Promise<T> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const ownerId = getCurrentOwnerId();
  const payload = {
    ...data,
    id,
    ownerId,
    created_at: data.created_at ?? now,
    updated_at: data.updated_at ?? now,
    timestamp: data.timestamp ?? now,
  };

  const document = await createFirestoreDocument(collection, id, payload);
  return documentToRecord<T>(document);
}

export async function getFirestoreSpecs(): Promise<Spec[]> {
  return sortByCreatedAt(await listCollection<Spec>('specs'));
}

export async function getFirestoreSpecsByCategory(category: string): Promise<Spec[]> {
  return (await getFirestoreSpecs()).filter((spec) => spec.category === category);
}

export async function createFirestoreSpec(
  spec: Omit<Spec, 'id' | 'created_at' | 'updated_at'>
): Promise<Spec> {
  return createRecord<Spec>('specs', spec);
}

export async function updateFirestoreSpec(
  id: string,
  updates: Partial<Omit<Spec, 'id' | 'created_at' | 'updated_at'>>
): Promise<Spec> {
  const existing = await getFirestoreDocument('specs', id);
  if (!existing) throw new Error(`Spec not found: ${id}`);

  const current = documentToRecord<Spec>(existing);
  const document = await updateFirestoreDocument('specs', id, {
    ...current,
    ...updates,
    id,
    ownerId: getCurrentOwnerId(),
    updated_at: new Date().toISOString(),
  });

  return documentToRecord<Spec>(document);
}

export async function getFirestoreRegistryEntries(): Promise<RegistryEntry[]> {
  return sortByCreatedAt(await listCollection<RegistryEntry>('registry'));
}

export async function getFirestoreRegistryByType(type: string): Promise<RegistryEntry[]> {
  return (await getFirestoreRegistryEntries()).filter((entry) => entry.type === type);
}

export async function createFirestoreRegistryEntry(
  entry: Omit<RegistryEntry, 'id' | 'created_at'>
): Promise<RegistryEntry> {
  return createRecord<RegistryEntry>('registry', entry);
}

export async function getFirestoreChangeRequests(): Promise<ChangeRequest[]> {
  return sortByCreatedAt(await listCollection<ChangeRequest>('change_requests'));
}

export async function getFirestoreChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
  return (await getFirestoreChangeRequests()).filter((request) => request.status === status);
}

export async function createFirestoreChangeRequest(
  request: Omit<ChangeRequest, 'id' | 'created_at' | 'reviewed_at' | 'implemented_at'>
): Promise<ChangeRequest> {
  return createRecord<ChangeRequest>('change_requests', request);
}

export async function updateFirestoreChangeRequest(
  id: string,
  updates: Partial<Omit<ChangeRequest, 'id' | 'created_at'>>
): Promise<ChangeRequest> {
  const existing = await getFirestoreDocument('change_requests', id);
  if (!existing) throw new Error(`Change request not found: ${id}`);

  const current = documentToRecord<ChangeRequest>(existing);
  const updateData: Record<string, unknown> = {
    ...current,
    ...updates,
    id,
    ownerId: getCurrentOwnerId(),
  };

  if (updates.status === 'approved' || updates.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString();
  }
  if (updates.status === 'implemented') {
    updateData.implemented_at = new Date().toISOString();
  }

  const document = await updateFirestoreDocument('change_requests', id, updateData);
  return documentToRecord<ChangeRequest>(document);
}

export async function getFirestoreReleases(): Promise<Release[]> {
  return sortByCreatedAt(await listCollection<Release>('releases'));
}

export async function getFirestoreRelease(id: string): Promise<Release | null> {
  const document = await getFirestoreDocument('releases', id);
  if (!document) return null;
  return documentToRecord<Release>(document);
}

export async function createFirestoreRelease(
  release: Omit<Release, 'id' | 'created_at' | 'released_at'>
): Promise<Release> {
  return createRecord<Release>('releases', release);
}

export async function updateFirestoreRelease(
  id: string,
  updates: Partial<Omit<Release, 'id' | 'created_at'>>
): Promise<Release> {
  const existing = await getFirestoreDocument('releases', id);
  if (!existing) throw new Error(`Release not found: ${id}`);

  const current = documentToRecord<Release>(existing);
  const updateData: Record<string, unknown> = {
    ...current,
    ...updates,
    id,
    ownerId: getCurrentOwnerId(),
  };

  if (updates.status === 'released') {
    updateData.released_at = new Date().toISOString();
  }

  const document = await updateFirestoreDocument('releases', id, updateData);
  return documentToRecord<Release>(document);
}

export async function getFirestoreAuditLogs(limit = 100): Promise<AuditLog[]> {
  return sortByTimestampDesc(await listCollection<AuditLog>('audit_logs')).slice(0, limit);
}

export async function getFirestoreAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  return (await getFirestoreAuditLogs(500)).filter(
    (log) => log.entity_type === entityType && log.entity_id === entityId
  );
}

export async function createFirestoreAuditLog(
  action: string,
  entityType: AuditLog['entity_type'],
  entityId: string | undefined,
  details: Record<string, unknown>
): Promise<AuditLog> {
  return createRecord<AuditLog>('audit_logs', {
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

export async function getFirestoreRouteManifest(): Promise<RouteManifestEntry[]> {
  const rows = await listCollection<RouteManifestEntry>('route_manifest');
  return rows
    .filter((entry) => entry.visible)
    .sort((a, b) => a.order_index - b.order_index);
}
