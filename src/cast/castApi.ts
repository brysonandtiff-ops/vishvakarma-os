import { backendStatus } from '@/backend/backendConfig';
import type { CastInviteRole } from '@/cast/castTier';
import type {
  CastBroadcastState,
  CastIntentEvent,
  CastJoinPayload,
  CastPinEvent,
  CastSessionRecord,
  LocalCastSession,
} from '@/cast/types';
import { DEFAULT_CAST_LENSES } from '@/cast/CastLensState';
import {
  clearLocalCastSession,
  generateLocalCastToken,
  getLocalCastBus,
  readLocalCastSession,
  storeLocalCastSession,
} from '@/cast/LocalCastBus';
import type { PlanTier } from '@/config/billingPlans';

function resolveApiBase(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function mapSessionRecord(raw: Record<string, unknown>): CastSessionRecord {
  return {
    id: String(raw.id),
    projectId: String(raw.projectId ?? raw.project_id),
    hostUserId: String(raw.hostUserId ?? raw.host_user_id),
    status: (raw.status as CastSessionRecord['status']) ?? 'live',
    presenterLensState: (raw.presenterLensState ?? raw.presenter_lens_state ?? DEFAULT_CAST_LENSES) as CastSessionRecord['presenterLensState'],
    chronoState: (raw.chronoState ?? raw.chrono_state ?? { locked: false, lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 } }) as CastSessionRecord['chronoState'],
    intentRelayEnabled: Boolean(raw.intentRelayEnabled ?? raw.intent_relay_enabled ?? true),
    chronoLockEnabled: Boolean(raw.chronoLockEnabled ?? raw.chrono_lock_enabled ?? false),
    viewerCount: Number(raw.viewerCount ?? raw.viewer_count ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    endedAt: (raw.endedAt ?? raw.ended_at ?? null) as string | null | undefined,
  };
}

export async function createCastSessionRequest(options: {
  projectId: string;
  idToken: string;
  role?: CastInviteRole;
}): Promise<{ session: CastSessionRecord; token: string; shareUrl: string }> {
  const response = await fetch(`${resolveApiBase()}/api/cast/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: options.projectId,
      inviteRole: options.role ?? 'viewer',
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Cast session create failed (${response.status})`);
  }

  const body = (await response.json()) as {
    session: Record<string, unknown>;
    token: string;
    shareUrl: string;
  };

  return {
    session: mapSessionRecord(body.session),
    token: body.token,
    shareUrl: body.shareUrl,
  };
}

export async function endCastSessionRequest(options: {
  sessionId: string;
  idToken: string;
}): Promise<void> {
  const response = await fetch(`${resolveApiBase()}/api/cast/sessions`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${options.idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId: options.sessionId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Cast session end failed (${response.status})`);
  }
}

export async function joinCastRequest(token: string): Promise<CastJoinPayload> {
  const response = await fetch(`${resolveApiBase()}/api/cast/join?token=${encodeURIComponent(token)}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Cast join failed (${response.status})`);
  }

  const body = (await response.json()) as CastJoinPayload & {
    session: Record<string, unknown>;
  };

  return {
    ...body,
    session: mapSessionRecord(body.session as unknown as Record<string, unknown>),
  };
}

export async function fetchCastEvidenceRequest(options: {
  sessionId: string;
  idToken: string;
}): Promise<{ evidence: unknown }> {
  const response = await fetch(
    `${resolveApiBase()}/api/cast/evidence?sessionId=${encodeURIComponent(options.sessionId)}`,
    {
      headers: { Authorization: `Bearer ${options.idToken}` },
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Cast evidence fetch failed (${response.status})`);
  }

  return (await response.json()) as { evidence: unknown };
}

export function createLocalCastSession(projectId: string): LocalCastSession {
  const token = generateLocalCastToken();
  const sessionId = `local-${token.slice(0, 12)}`;
  storeLocalCastSession({ sessionId, projectId, token });
  const shareUrl = `${resolveApiBase()}/cast/${token}`;
  return { sessionId, projectId, token, shareUrl, isLocal: true };
}

export function resolveLocalCastJoin(token: string): LocalCastSession | null {
  const stored = readLocalCastSession();
  if (!stored || stored.token !== token) return null;
  return {
    sessionId: stored.sessionId,
    projectId: stored.projectId,
    token: stored.token,
    shareUrl: `${resolveApiBase()}/cast/${token}`,
    isLocal: true,
  };
}

export function clearLocalCast(): void {
  clearLocalCastSession();
}

export function shouldUseLocalCastFallback(): boolean {
  return !backendStatus.isConfigured || import.meta.env.VITE_CAST_LOCAL_ONLY === 'true';
}

export function buildShareUrl(token: string): string {
  return `${resolveApiBase()}/cast/${token}`;
}

export type { PlanTier };

export function publishLocalCastEnd(sessionId: string): void {
  getLocalCastBus().publish({ type: 'session_end', sessionId });
}

export function publishLocalViewerJoin(sessionId: string): void {
  getLocalCastBus().publish({ type: 'viewer_join', sessionId });
}
