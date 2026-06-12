import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for collab server auth');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

export async function verifyCollabToken(token: string): Promise<{ uid: string; email?: string }> {
  const client = getAdminClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    throw error ?? new Error('Invalid Supabase collab token');
  }

  return {
    uid: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export async function canJoinProjectRoom(uid: string, projectId: string): Promise<boolean> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('projects')
    .select('user_id, collaborators')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) return false;
  if (data.user_id === uid) return true;

  const collaborators: string[] = Array.isArray(data.collaborators) ? data.collaborators : [];
  return collaborators.includes(uid);
}

export function extractProjectIdFromRoom(roomName: string): string | null {
  if (!roomName.startsWith('project-')) return null;
  return roomName.slice('project-'.length);
}
