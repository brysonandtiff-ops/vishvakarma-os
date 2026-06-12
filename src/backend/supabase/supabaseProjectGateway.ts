import type { Project, ProjectManifest } from '@/types';
import { mapProjectRow } from '@/backend/supabase/mappers';
import { readSupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

function getCurrentUserId() {
  return readSupabaseSessionSnapshot()?.uid ?? null;
}

export async function getSupabaseProjects(): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProjectRow(row as Record<string, unknown>));
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
