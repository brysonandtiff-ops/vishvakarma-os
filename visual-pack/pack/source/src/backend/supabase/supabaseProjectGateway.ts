import type { CollabSnapshot, Project, ProjectManifest } from '@/types';
import { mapProjectRow } from '@/backend/supabase/mappers';
import { readSupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

function getCurrentUserId() {
  return readSupabaseSessionSnapshot()?.uid ?? null;
}

function mapCollabSnapshot(value: unknown): CollabSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  const state = typeof row.state === 'string' ? row.state : '';
  if (!state) return undefined;

  return {
    state,
    updatedAt:
      typeof row.updatedAt === 'string'
        ? row.updatedAt
        : typeof row.updated_at === 'string'
          ? row.updated_at
          : new Date().toISOString(),
    revision: Number(row.revision ?? 0),
  };
}

function serializeCollabSnapshot(snapshot: CollabSnapshot) {
  return {
    state: snapshot.state,
    updated_at: snapshot.updatedAt,
    revision: snapshot.revision,
  };
}

export async function getSupabaseProjects(): Promise<Project[]> {
  const client = getSupabaseClient();
  const userId = getCurrentUserId();
  if (!client) return [];

  const { data, error } = await client
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => mapProjectRow(row as Record<string, unknown>))
    .filter(
      (project) =>
        !userId ||
        project.ownerId === userId ||
        (project.collaborators ?? []).includes(userId)
    );
}

export async function getSupabaseProject(id: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProjectRow(data as Record<string, unknown>);
}

export async function createSupabaseProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest
): Promise<Project> {
  const client = getSupabaseClient();
  const userId = getCurrentUserId();
  if (!client || !userId) throw new Error('Supabase session is not available.');

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('projects')
    .insert({
      user_id: userId,
      name,
      description: description ?? null,
      manifest,
      collaborators: [userId],
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapProjectRow(data as Record<string, unknown>);
}

export async function updateSupabaseProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>
): Promise<Project> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const existing = await getSupabaseProject(id);
  if (!existing) throw new Error(`Project not found: ${id}`);

  const { data, error } = await client
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapProjectRow(data as Record<string, unknown>);
}

export async function deleteSupabaseProject(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { error } = await client.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function getSupabaseProjectCollabSnapshot(
  projectId: string
): Promise<CollabSnapshot | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('projects')
    .select('collab_snapshot')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw error;
  return mapCollabSnapshot(data?.collab_snapshot) ?? null;
}

export async function updateSupabaseProjectCollabSnapshot(
  projectId: string,
  snapshot: CollabSnapshot
): Promise<Project> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client
    .from('projects')
    .update({
      collab_snapshot: serializeCollabSnapshot(snapshot),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProjectRow(data as Record<string, unknown>);
}

export async function addSupabaseProjectCollaborator(
  projectId: string,
  collaboratorId: string
): Promise<Project> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const existing = await getSupabaseProject(projectId);
  if (!existing) throw new Error(`Project not found: ${projectId}`);

  const collaborators = new Set(existing.collaborators ?? []);
  collaborators.add(collaboratorId);

  const { data, error } = await client
    .from('projects')
    .update({
      collaborators: Array.from(collaborators),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProjectRow(data as Record<string, unknown>);
}
