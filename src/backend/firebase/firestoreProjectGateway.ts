import { fetchWithRetry } from '@/backend/fetchWithRetry';
import type { CollabSnapshot, Project, ProjectManifest } from '@/types';
import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  documentToRecord,
  getCurrentOwnerId,
  getFirestoreDocument,
  listFirestoreDocuments,
  updateFirestoreDocument,
} from './firestoreRestClient';

const PROJECTS_COLLECTION = 'projects';

export async function getFirestoreProjects(): Promise<Project[]> {
  const documents = await fetchWithRetry(() => listFirestoreDocuments(PROJECTS_COLLECTION));
  const ownerId = getCurrentOwnerId();

  return documents
    .map((document) => documentToRecord<Project & { ownerId?: string }>(document))
    .filter(
      (project) =>
        !ownerId ||
        project.ownerId === ownerId ||
        (project.collaborators ?? []).includes(ownerId)
    )
    .map(({ ownerId: _ownerId, ...project }) => project)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getFirestoreProject(id: string): Promise<Project | null> {
  const document = await getFirestoreDocument(PROJECTS_COLLECTION, id);
  if (!document) return null;
  return documentToRecord<Project>(document);
}

export async function createFirestoreProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const ownerId = getCurrentOwnerId();

  const project: Record<string, unknown> = {
    id,
    name,
    description: description ?? null,
    manifest,
    ownerId,
    collaborators: ownerId ? [ownerId] : [],
    created_at: now,
    updated_at: now,
  };

  const document = await createFirestoreDocument(PROJECTS_COLLECTION, id, project);
  return documentToRecord<Project>(document);
}

export async function updateFirestoreProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>
): Promise<Project> {
  const existing = await getFirestoreProject(id);
  if (!existing) throw new Error(`Firestore project not found: ${id}`);

  const updated: Record<string, unknown> = {
    ...existing,
    ...updates,
    id,
    ownerId: getCurrentOwnerId(),
    updated_at: new Date().toISOString(),
  };

  const document = await updateFirestoreDocument(PROJECTS_COLLECTION, id, updated);
  return documentToRecord<Project>(document);
}

export async function deleteFirestoreProject(id: string): Promise<void> {
  await deleteFirestoreDocument(PROJECTS_COLLECTION, id);
}

export async function getFirestoreProjectCollabSnapshot(
  projectId: string
): Promise<CollabSnapshot | null> {
  const project = await getFirestoreProject(projectId);
  return project?.collabSnapshot ?? null;
}

export async function updateFirestoreProjectCollabSnapshot(
  projectId: string,
  snapshot: CollabSnapshot
): Promise<Project> {
  const existing = await getFirestoreProject(projectId);
  if (!existing) throw new Error(`Firestore project not found: ${projectId}`);

  const updated: Record<string, unknown> = {
    ...existing,
    id: projectId,
    collabSnapshot: snapshot,
    updated_at: new Date().toISOString(),
  };

  const document = await updateFirestoreDocument(PROJECTS_COLLECTION, projectId, updated);
  return documentToRecord<Project>(document);
}

export async function addFirestoreProjectCollaborator(
  projectId: string,
  collaboratorId: string
): Promise<Project> {
  const existing = await getFirestoreProject(projectId);
  if (!existing) throw new Error(`Firestore project not found: ${projectId}`);

  const collaborators = new Set(existing.collaborators ?? []);
  collaborators.add(collaboratorId);

  const updated: Record<string, unknown> = {
    ...existing,
    id: projectId,
    collaborators: Array.from(collaborators),
    updated_at: new Date().toISOString(),
  };

  const document = await updateFirestoreDocument(PROJECTS_COLLECTION, projectId, updated);
  return documentToRecord<Project>(document);
}
