import type {
  AuditLog,
  ChangeRequest,
  CollabSnapshot,
  Profile,
  Project,
  RegistryEntry,
  Release,
  RouteManifestEntry,
  Spec,
} from '@/types';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: asString(row.id),
    email: asOptionalString(row.email),
    full_name: asOptionalString(row.full_name),
    avatar_url: asOptionalString(row.avatar_url),
    role: asOptionalString(row.role),
    created_at: asOptionalString(row.created_at),
    updated_at: asOptionalString(row.updated_at),
  };
}

export function mapProjectRow(row: Record<string, unknown>): Project {
  const collaborators = Array.isArray(row.collaborators)
    ? row.collaborators.map(String)
    : undefined;

  let collabSnapshot: CollabSnapshot | undefined;
  if (row.collab_snapshot && typeof row.collab_snapshot === 'object') {
    const snapshot = row.collab_snapshot as Record<string, unknown>;
    const state = typeof snapshot.state === 'string' ? snapshot.state : '';
    if (state) {
      collabSnapshot = {
        state,
        updatedAt:
          typeof snapshot.updatedAt === 'string'
            ? snapshot.updatedAt
            : typeof snapshot.updated_at === 'string'
              ? snapshot.updated_at
              : '',
        revision: Number(snapshot.revision ?? 0),
      };
    }
  }

  return {
    id: asString(row.id),
    name: asString(row.name),
    description: asOptionalString(row.description),
    manifest: (row.manifest ?? {}) as Project['manifest'],
    ownerId: asOptionalString(row.user_id),
    collaborators,
    collabSnapshot,
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

export function mapSpecRow(row: Record<string, unknown>): Spec {
  return {
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category),
    content: asString(row.content),
    version: asString(row.version, '1.0.0'),
    status: row.status as Spec['status'],
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

export function mapRegistryRow(row: Record<string, unknown>): RegistryEntry {
  return {
    id: asString(row.id),
    name: asString(row.name),
    type: row.type as RegistryEntry['type'],
    description: asOptionalString(row.description),
    metadata: row.metadata as RegistryEntry['metadata'],
    status: row.status as RegistryEntry['status'],
    created_at: asString(row.created_at),
  };
}

export function mapChangeRequestRow(row: Record<string, unknown>): ChangeRequest {
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asString(row.description),
    type: row.type as ChangeRequest['type'],
    status: row.status as ChangeRequest['status'],
    priority: row.priority as ChangeRequest['priority'],
    requester: asOptionalString(row.requester),
    reviewer: asOptionalString(row.reviewer),
    created_at: asString(row.created_at),
    reviewed_at: asOptionalString(row.reviewed_at),
    implemented_at: asOptionalString(row.implemented_at),
  };
}

export function mapReleaseRow(row: Record<string, unknown>): Release {
  return {
    id: asString(row.id),
    version: asString(row.version),
    title: asString(row.title),
    description: asOptionalString(row.description),
    change_requests: Array.isArray(row.change_requests)
      ? row.change_requests.map(String)
      : [],
    status: row.status as Release['status'],
    evidence_pack: row.evidence_pack as Release['evidence_pack'],
    released_at: asOptionalString(row.released_at),
    created_at: asString(row.created_at),
  };
}

export function mapAuditLogRow(row: Record<string, unknown>): AuditLog {
  return {
    id: asString(row.id),
    action: asString(row.action),
    entity_type: row.entity_type as AuditLog['entity_type'],
    entity_id: asOptionalString(row.entity_id),
    details: (row.details ?? {}) as Record<string, unknown>,
    timestamp: asString(row.timestamp ?? row.created_at),
  };
}

export function mapRouteManifestRow(row: Record<string, unknown>): RouteManifestEntry {
  return {
    id: asString(row.id),
    path: asString(row.path),
    name: asString(row.name),
    component: asString(row.component),
    category: row.category as RouteManifestEntry['category'],
    visible: Boolean(row.visible ?? true),
    order_index: Number(row.order_index ?? 0),
    created_at: asString(row.created_at),
  };
}
