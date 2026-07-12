import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SecureApiRequest,
  SecureApiResponse,
} from './_lib/httpSecurity';

const mocks = vi.hoisted(() => ({
  verifyAuthTokenFromRequest: vi.fn(),
  joinCastByToken: vi.fn(),
  resolveUserPlanTier: vi.fn(),
  fetchCastEvidence: vi.fn(),
  assertProjectAccess: vi.fn(),
  createCastSession: vi.fn(),
  endCastSession: vi.fn(),
  resolveCollabWsUrl: vi.fn(() => ''),
  consumeAiQuota: vi.fn(),
}));

vi.mock('./_lib/verifyAuthToken', () => ({
  verifyAuthTokenFromRequest: mocks.verifyAuthTokenFromRequest,
}));

vi.mock('./_lib/castBackend', () => ({
  joinCastByToken: mocks.joinCastByToken,
  resolveUserPlanTier: mocks.resolveUserPlanTier,
  fetchCastEvidence: mocks.fetchCastEvidence,
  assertProjectAccess: mocks.assertProjectAccess,
  createCastSession: mocks.createCastSession,
  endCastSession: mocks.endCastSession,
  resolveCollabWsUrl: mocks.resolveCollabWsUrl,
}));

vi.mock('./_lib/aiUsage', () => ({
  consumeAiQuota: mocks.consumeAiQuota,
}));

import extractRequirements from './ai/extract-requirements';
import parseSiteDocuments from './ai/parse-site-documents';
import castEvidence from './cast/evidence';
import castJoin from './cast/join';
import castSessions from './cast/sessions';
import health from './health';

function request(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
} = {}): SecureApiRequest {
  return {
    method: options.method ?? 'GET',
    url: options.url,
    body: options.body,
    headers: options.headers ?? {},
  } as SecureApiRequest;
}

function response() {
  const headers = new Map<string, string>();
  const json = vi.fn();
  const res = {
    setHeader: (name: string, value: string) => headers.set(name, value),
    status: vi.fn(),
    json,
  } as unknown as SecureApiResponse;
  (res.status as unknown as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return { res, headers, json };
}

function expectStatus(
  result: ReturnType<typeof response>,
  status: number,
  body?: unknown,
) {
  expect(result.res.status).toHaveBeenCalledWith(status);
  if (body !== undefined) expect(result.json).toHaveBeenCalledWith(body);
  expect(result.headers.get('Cache-Control')).toContain('no-store');
}

const previousSupabaseUrl = process.env.SUPABASE_URL;
const previousServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('serverless endpoint security boundaries', () => {
  beforeEach(() => {
    mocks.verifyAuthTokenFromRequest.mockReset();
    mocks.joinCastByToken.mockReset();
    mocks.resolveUserPlanTier.mockReset();
    mocks.fetchCastEvidence.mockReset();
    mocks.assertProjectAccess.mockReset();
    mocks.createCastSession.mockReset();
    mocks.endCastSession.mockReset();
    mocks.resolveCollabWsUrl.mockReset().mockReturnValue('');
    mocks.consumeAiQuota.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRole;
  });

  it.each([
    ['AI extraction', extractRequirements],
    ['site document parsing', parseSiteDocuments],
  ] as const)('rejects unauthenticated %s requests', async (_label, handler) => {
    mocks.verifyAuthTokenFromRequest.mockResolvedValue(null);
    const result = response();

    await handler(request({ method: 'POST', body: {} }), result.res);

    expectStatus(result, 401);
  });

  it.each([
    [
      'cast evidence',
      castEvidence,
      'GET',
      '/api/cast/evidence?sessionId=00000000-0000-4000-8000-000000000000',
    ],
    ['cast sessions', castSessions, 'POST', '/api/cast/sessions'],
  ] as const)(
    'rejects unauthenticated %s requests',
    async (_label, handler, method, url) => {
      mocks.verifyAuthTokenFromRequest.mockResolvedValue(null);
      const result = response();

      await handler(request({ method, url, body: {} }), result.res);

      expectStatus(result, 401);
    },
  );

  it('rejects malformed public cast tokens before database work', async () => {
    const result = response();

    await castJoin(
      request({ method: 'GET', url: '/api/cast/join?token=short' }),
      result.res,
    );

    expectStatus(result, 404, { error: 'Cast invitation is invalid or expired.' });
    expect(mocks.joinCastByToken).not.toHaveBeenCalled();
  });

  it('returns a minimal healthy response without provider configuration details', () => {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'configured-for-test';

    const result = response();
    health(request({ method: 'GET', url: '/api/health' }), result.res);

    expectStatus(result, 200);
    const body = result.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body).toMatchObject({ ok: true, service: 'vishvakarma-os' });
    expect(body).not.toHaveProperty('checks');
  });

  it('rejects unsupported methods consistently', async () => {
    const endpoints = [
      extractRequirements,
      parseSiteDocuments,
      castEvidence,
      castJoin,
      castSessions,
    ];

    for (const handler of endpoints) {
      const result = response();
      await handler(request({ method: 'PATCH' }), result.res);
      expectStatus(result, 405, { error: 'Method not allowed' });
      expect(result.headers.get('Allow')).toBeTruthy();
    }
  });
});
