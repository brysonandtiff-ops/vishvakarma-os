import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getBillingRecord } from './billingBackend';
import { isCoOwnerEmail } from '../../src/config/coOwners';
import type { PlanTier } from '../../src/config/billingPlans';

export type CastInviteRole = 'viewer' | 'family' | 'council_reviewer';

export type CastSessionRow = {
  id: string;
  project_id: string;
  host_user_id: string;
  status: 'live' | 'ended';
  presenter_lens_state: Record<string, unknown>;
  chrono_state: Record<string, unknown>;
  intent_relay_enabled: boolean;
  chrono_lock_enabled: boolean;
  viewer_count: number;
  created_at: string;
  ended_at: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for cast API.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hashCastToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateCastToken(): string {
  return randomBytes(32).toString('hex');
}

export async function resolveUserPlanTier(uid: string, email?: string): Promise<PlanTier> {
  if (email && isCoOwnerEmail(email)) return 'enterprise';
  const billing = await getBillingRecord(uid);
  if (!billing) return 'starter';
  const active = billing.status === 'active' || billing.status === 'trialing' || billing.status === 'past_due';
  if (billing.plan === 'enterprise' && active) return 'enterprise';
  if (billing.plan === 'studio' && active) return 'studio';
  return 'starter';
}

export async function assertProjectAccess(uid: string, projectId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('projects')
    .select('user_id, collaborators')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Project not found');
  }

  const collaborators: string[] = Array.isArray(data.collaborators) ? data.collaborators : [];
  if (data.user_id !== uid && !collaborators.includes(uid)) {
    throw new Error('Forbidden');
  }
}

export async function createCastSession(options: {
  hostUserId: string;
  projectId: string;
  inviteRole?: CastInviteRole;
}): Promise<{ session: CastSessionRow; token: string }> {
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from('cast_sessions')
    .select('id')
    .eq('project_id', options.projectId)
    .eq('status', 'live')
    .maybeSingle();

  if (existing) {
    await admin
      .from('cast_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  const { data: session, error } = await admin
    .from('cast_sessions')
    .insert({
      project_id: options.projectId,
      host_user_id: options.hostUserId,
      status: 'live',
      presenter_lens_state: {},
      chrono_state: { locked: false, lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 } },
      intent_relay_enabled: true,
      chrono_lock_enabled: false,
    })
    .select('*')
    .single();

  if (error || !session) {
    throw new Error(error?.message ?? 'Failed to create cast session');
  }

  const token = generateCastToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: inviteError } = await admin.from('cast_invites').insert({
    session_id: session.id,
    token_hash: hashCastToken(token),
    role: options.inviteRole ?? 'viewer',
    expires_at: expiresAt,
    max_uses: null,
  });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  await admin.from('cast_events').insert({
    session_id: session.id,
    event_type: 'join',
    payload: { hostUserId: options.hostUserId, action: 'session_created' },
  });

  return { session: session as CastSessionRow, token };
}

export async function endCastSession(sessionId: string, hostUserId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('cast_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('host_user_id', hostUserId)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    throw new Error('Cast session not found or forbidden');
  }

  await admin.from('cast_events').insert({
    session_id: sessionId,
    event_type: 'end',
    payload: { hostUserId },
  });
}

export async function joinCastByToken(token: string): Promise<{
  session: CastSessionRow;
  projectId: string;
  projectName: string;
  role: CastInviteRole;
  manifest: unknown | null;
}> {
  const admin = getSupabaseAdmin();
  const tokenHash = hashCastToken(token);

  const { data: invite, error: inviteError } = await admin
    .from('cast_invites')
    .select('id, session_id, role, expires_at, max_uses, use_count')
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

  const { data: session, error: sessionError } = await admin
    .from('cast_sessions')
    .select('*')
    .eq('id', invite.session_id)
    .eq('status', 'live')
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error('Cast session is not live');
  }

  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id, name, collab_snapshot')
    .eq('id', session.project_id)
    .maybeSingle();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  await admin
    .from('cast_invites')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id);

  await admin
    .from('cast_sessions')
    .update({ viewer_count: (session.viewer_count ?? 0) + 1 })
    .eq('id', session.id);

  await admin.from('cast_events').insert({
    session_id: session.id,
    event_type: 'join',
    payload: { role: invite.role },
  });

  return {
    session: session as CastSessionRow,
    projectId: project.id,
    projectName: project.name ?? 'Project',
    role: invite.role as CastInviteRole,
    manifest: project.collab_snapshot ?? null,
  };
}

export async function updateCastSessionState(
  sessionId: string,
  hostUserId: string,
  patch: {
    presenter_lens_state?: Record<string, unknown>;
    chrono_state?: Record<string, unknown>;
    intent_relay_enabled?: boolean;
    chrono_lock_enabled?: boolean;
  }
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('cast_sessions')
    .update(patch)
    .eq('id', sessionId)
    .eq('host_user_id', hostUserId)
    .eq('status', 'live');

  if (error) {
    throw new Error(error.message);
  }
}

export async function appendCastEvent(
  sessionId: string,
  eventType: 'intent' | 'lens' | 'chrono' | 'pin',
  payload: Record<string, unknown>
): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from('cast_events').insert({
    session_id: sessionId,
    event_type: eventType,
    payload,
  });
}

export async function fetchCastEvidence(sessionId: string, requesterId: string): Promise<unknown> {
  const admin = getSupabaseAdmin();

  const { data: session, error } = await admin
    .from('cast_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) {
    throw new Error('Cast session not found');
  }

  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('user_id, collaborators')
    .eq('id', session.project_id)
    .maybeSingle();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
  const allowed =
    session.host_user_id === requesterId ||
    project.user_id === requesterId ||
    collaborators.includes(requesterId);

  if (!allowed) {
    throw new Error('Forbidden');
  }

  const { data: events } = await admin
    .from('cast_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return {
    sessionId,
    projectId: session.project_id,
    startedAt: session.created_at,
    endedAt: session.ended_at,
    events: events ?? [],
  };
}

export function resolveCollabWsUrl(): string {
  const configured = process.env.VITE_COLLAB_WS_URL ?? process.env.COLLAB_WS_URL;
  if (configured && configured.trim()) return configured.trim();
  return '';
}
