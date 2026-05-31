import { backendStatus } from '@/backend/backendConfig';
import { readFirebaseSessionSnapshot } from './firebaseAuthGateway';

export const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1';

export type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: FirestoreFields } }
  | { arrayValue: { values?: FirestoreValue[] } };

export type FirestoreFields = Record<string, FirestoreValue>;

export interface FirestoreDocument {
  name: string;
  fields?: FirestoreFields;
  createTime?: string;
  updateTime?: string;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  error?: { message?: string };
}

export function getFirebaseProjectId() {
  return import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
}

export function firestoreCollectionUrl(collection: string) {
  const projectId = getFirebaseProjectId();
  if (!projectId) return null;
  return `${FIRESTORE_API_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collection}`;
}

export function firestoreDocumentUrl(id: string, collection: string) {
  const collectionUrl = firestoreCollectionUrl(collection);
  if (!collectionUrl) return null;
  return `${collectionUrl}/${encodeURIComponent(id)}`;
}

export function getFirestoreAuthHeaders() {
  const session = readFirebaseSessionSnapshot();
  if (!session) {
    throw new Error('Firebase session is missing. Sign in again before using Firestore.');
  }

  return {
    Authorization: `Bearer ${session.idToken}`,
    'Content-Type': 'application/json',
  };
}

export function getCurrentOwnerId() {
  return readFirebaseSessionSnapshot()?.uid ?? null;
}

export function assertFirestoreConfigured() {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }
}

export function toFirestoreValue(value: unknown): FirestoreValue {
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

export function objectToFirestoreFields(value: Record<string, unknown>): FirestoreFields {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, toFirestoreValue(entry)])
  );
}

export function fromFirestoreValue(value: FirestoreValue): unknown {
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

export function firestoreFieldsToObject(fields: FirestoreFields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

export function documentIdFromName(name: string) {
  return name.split('/').pop() ?? name;
}

export async function parseFirestoreResponse(response: Response) {
  const payload = (await response.json()) as FirestoreDocument & FirestoreListResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Firestore request failed with status ${response.status}`);
  }

  return payload;
}

export async function listFirestoreDocuments(collection: string): Promise<FirestoreDocument[]> {
  assertFirestoreConfigured();
  const url = firestoreCollectionUrl(collection);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    headers: getFirestoreAuthHeaders(),
  });
  const payload = (await parseFirestoreResponse(response)) as FirestoreListResponse;
  return payload.documents ?? [];
}

export async function getFirestoreDocument(collection: string, id: string): Promise<FirestoreDocument | null> {
  assertFirestoreConfigured();
  const url = firestoreDocumentUrl(id, collection);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    headers: getFirestoreAuthHeaders(),
  });

  if (response.status === 404) return null;

  return (await parseFirestoreResponse(response)) as FirestoreDocument;
}

export async function createFirestoreDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<FirestoreDocument> {
  assertFirestoreConfigured();
  const url = firestoreCollectionUrl(collection);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(`${url}?documentId=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: getFirestoreAuthHeaders(),
    body: JSON.stringify({ fields: objectToFirestoreFields(data) }),
  });

  return (await parseFirestoreResponse(response)) as FirestoreDocument;
}

export async function updateFirestoreDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<FirestoreDocument> {
  assertFirestoreConfigured();
  const url = firestoreDocumentUrl(id, collection);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getFirestoreAuthHeaders(),
    body: JSON.stringify({ fields: objectToFirestoreFields(data) }),
  });

  return (await parseFirestoreResponse(response)) as FirestoreDocument;
}

export async function deleteFirestoreDocument(collection: string, id: string): Promise<void> {
  assertFirestoreConfigured();
  const url = firestoreDocumentUrl(id, collection);
  if (!url) throw new Error('Missing VITE_FIREBASE_PROJECT_ID.');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getFirestoreAuthHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    await parseFirestoreResponse(response);
  }
}

export function documentToRecord<T extends { id: string }>(
  document: FirestoreDocument,
  defaults: Partial<T> = {}
): T {
  const fields = firestoreFieldsToObject(document.fields ?? {});
  const id = typeof fields.id === 'string' ? fields.id : documentIdFromName(document.name);

  return {
    ...defaults,
    ...fields,
    id,
  } as T;
}
