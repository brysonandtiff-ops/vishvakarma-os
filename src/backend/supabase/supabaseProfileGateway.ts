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
  // Never send a role update from a browser profile creation request.
  const { data, error } = await client
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: email.split('@')[0] ?? 'Architect',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error?.code === '23505') {
    const concurrentProfile = await getSupabaseProfile(userId);
    if (concurrentProfile) return concurrentProfile;
  }
  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function updateSupabaseProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): Promise<Profile> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const { data, error } = await client
    .from('profiles')
    .update({
      ...(typeof updates.full_name === 'string' ? { full_name: updates.full_name } : {}),
      ...(typeof updates.avatar_url === 'string' ? { avatar_url: updates.avatar_url } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}
