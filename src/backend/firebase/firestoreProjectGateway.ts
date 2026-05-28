import { backendStatus } from '@/backend/backendConfig';
import { readFirebaseSessionSnapshot } from './firebaseAuthGateway';
import type { Project, ProjectManifest } from '@/types';

const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1';
const PROJECTS_COLLECTION = 'projects';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: FirestoreFields } }
  | { arrayValue: { values?: FirestoreValue[] } };

type FirestoreFields = Record<string, FirestoreValue>;

interface FirestoreDocument {
  name: string;
  fields?: FirestoreFields;
  createTime?: string;
  updateTime?: string;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  error?: { message?: string };
}

function getFirebaseProjectId() {
  return import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
}

function firestoreCollectionUrl(collection = PROJECTS_COLLECTION) {
  const projectId = getFirebaseProjectId();
  if (!projectId) return null;
  return `${FIRESTORE_API_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collection}`;
}

function firestoreDocumentUrl(id: string, collection = PROJECTS_COLLECTION) {
  const collectionUrl = firestoreCollectionUrl(collection);
  if (!collectionUrl) return null;
  return `${collectionUrl}/${encodeURIComponent(id)}`;
}

function getFirestoreAuthHeaders() {
  const session = readFirebaseSessionSnapshot();
  if (!session) {
    throw new Error('Firebase session is missing. Sign in again before saving or loading Firestore projects.');
  }

  return {
    Authorization: `Bearer ${session.idToken}`,
    'Content-Type': 'application/json',
  };
}

function assertFirebaseConfigured() {
  if (backendStatus.provider !== 'firebase' || !backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: objectToFirestoreFields(value as Record<string, unknown>) } };
  }

  return { stringValue: String(value) };
}

function objectToFirestoreFields(value: Record<string, unknown>): FirestoreFields {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, toFirestoreValue(entry)])
  );
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in value) return firestoreFieldsToObject(value.mapValue.fields ?? {});
  return null;
}

function firestoreFieldsToObject(fields: FirestoreFields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function documentIdFromName(name: string) {
  return name.split('/').pop() ?? name;
}

function firestoreDocumentToProject(document: FirestoreDocument): Project {
  const fields = firestoreFieldsToObject(document.fields ?? {});

  return {
    id: typeof fields.id === 'string' ? fields.id : documentIdFromName(document.name),
    name: typeof fields.name === 'string' ? fields.name : 'Untitled Project',
    description: typeof fields.description === 'string' ? fields.description : undefined,
    manifest: fields.manifest as ProjectManifest,
    created_at: typeof fields.created_at === 'string' ? fields.created_at : document.createTime ?? new Date().toISOString(),
    updated_at: typeof fields.updated_at === 'string' ? fields.updated_at : document.updateTime ?? new Date().toISOString(),
  };
}

async function parseFirestoreResponse(response: Response) {
  const payload = (await response.json()) as FirestoreDocument & FirestoreListResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Firestore request failed with status ${response.status}`);
  }

  return payload;
}

export async function getFirestoreProjects(): Promise<Project[]> {
  assertFirebaseConfigured();
  const url = firestoreCollectionUrl();
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(`${url}?orderBy=created_at desc`, {
    headers: getFirestoreAuthHeaders(),
  });
  const payload = await parseFirestoreResponse(response) as FirestoreListResponse;

  return (payload.documents ?? []).map(firestoreDocumentToProject);
}

export async function getFirestoreProject(id: string): Promise<Project | null> {
  assertFirebaseConfigured();
  const url = firestoreDocumentUrl(id);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    headers: getFirestoreAuthHeaders(),
  });

  if (response.status === 404) return null;

  const payload = await parseFirestoreResponse(response) as FirestoreDocument;
  return firestoreDocumentToProject(payload);
}

export async function createFirestoreProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  assertFirebaseConfigured();
  const url = firestoreCollectionUrl();
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const project: Project = {
    id,
    name,
    description,
    manifest,
    created_at: now,
    updated_at: now,
  };

  const response = await fetch(`${url}?documentId=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: getFirestoreAuthHeaders(),
    body: JSON.stringify({ fields: objectToFirestoreFields(project as unknown as Record<string, unknown>) }),
  });

  const payload = await parseFirestoreResponse(response) as FirestoreDocument;
  return firestoreDocumentToProject(payload);
}

export async function updateFirestoreProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>
): Promise<Project> {
  assertFirebaseConfigured();
  const url = firestoreDocumentUrl(id);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const existing = await getFirestoreProject(id);
  if (!existing) throw new Error(`Firestore project not found: ${id}`);

  const updated: Project = {
    ...existing,
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getFirestoreAuthHeaders(),
    body: JSON.stringify({ fields: objectToFirestoreFields(updated as unknown as Record<string, unknown>) }),
  });

  const payload = await parseFirestoreResponse(response) as FirestoreDocument;
  return firestoreDocumentToProject(payload);
}

export async function deleteFirestoreProject(id: string): Promise<void> {
  assertFirebaseConfigured();
  const url = firestoreDocumentUrl(id);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getFirestoreAuthHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    await parseFirestoreResponse(response);
  }
}
