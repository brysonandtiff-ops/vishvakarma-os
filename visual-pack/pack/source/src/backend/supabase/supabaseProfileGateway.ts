import type { Profile } from '@/types';
import { mapProfileRow } from '@/backend/supabase/mappers';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

export async function getSupabaseProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function ensureSupabaseProfile(userId: string, email: string): Promise<Profile> {
  const existing = await getSupabaseProfile(userId);
  if (existing) return existing;

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: email.split('@')[0] ?? 'Architect',
      role: 'user',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function updateSupabaseProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}
