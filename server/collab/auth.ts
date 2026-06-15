import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

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

function hashCastToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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

export async function verifyCastViewerToken(
  token: string
): Promise<{ uid: string; projectId: string; sessionId: string; role: string }> {
  const client = getAdminClient();
  const tokenHash = hashCastToken(token);

  const { data: invite, error: inviteError } = await client
    .from('cast_invites')
    .select('session_id, role, expires_at, max_uses, use_count')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (inviteError || !invite) {
    throw new Error('Invalid cast token');
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error('Cast token expired');
  }

  if (invite.max_uses != null && invite.use_count >= invite.max_uses) {
    throw new Error('Cast token usage limit reached');
  }

  const { data: session, error: sessionError } = await client
    .from('cast_sessions')
    .select('id, project_id, status')
    .eq('id', invite.session_id)
    .eq('status', 'live')
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error('Cast session is not live');
  }

  return {
    uid: `cast-viewer-${session.id.slice(0, 8)}`,
    projectId: session.project_id,
    sessionId: session.id,
    role: invite.role,
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

export function parseAuthTokenFromUrl(url: string | undefined): { token: string | null; castToken: string | null } {
  if (!url) return { token: null, castToken: null };
  try {
    const parsed = new URL(url, 'http://localhost');
    return {
      token: parsed.searchParams.get('token'),
      castToken: parsed.searchParams.get('castToken'),
    };
  } catch {
    return { token: null, castToken: null };
  }
}
