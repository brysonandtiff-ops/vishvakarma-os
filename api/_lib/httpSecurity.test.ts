import { describe, expect, it, vi } from 'vitest';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  parseBoundedJsonBody,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from './httpSecurity';

function request(body?: unknown, method = 'POST') {
  return { method, body, headers: {} } as SecureApiRequest;
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

describe('API HTTP security helpers', () => {
  it('sets private no-store response headers', () => {
    const { res, headers } = response();
    applyApiSecurityHeaders(res);

    expect(headers.get('Cache-Control')).toContain('no-store');
    expect(headers.get('Pragma')).toBe('no-cache');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('rejects unsupported methods and declares Allow', () => {
    const { res, headers, json } = response();
    expect(enforceApiMethod(request(undefined, 'GET'), res, ['POST'])).toBe(false);
    expect(headers.get('Allow')).toBe('POST');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('parses object and serialized JSON bodies', () => {
    expect(parseBoundedJsonBody(request({ plan: 'studio' }))).toEqual({ plan: 'studio' });
    expect(parseBoundedJsonBody(request('{"plan":"enterprise"}'))).toEqual({
      plan: 'enterprise',
    });
  });

  it('rejects malformed, oversized, array, and cyclic bodies', () => {
    expect(() => parseBoundedJsonBody(request('{bad json'))).toThrow(
      'Request body is not valid JSON',
    );
    expect(() => parseBoundedJsonBody(request('x'.repeat(33)), 32)).toThrow(
      'Request body is too large',
    );
    expect(() => parseBoundedJsonBody(request([]))).toThrow(
      'Request body must be a JSON object',
    );

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => parseBoundedJsonBody(request(cyclic))).toThrow(
      'Request body must be JSON serializable',
    );
  });

  it('exposes only approved request errors and hides unknown failures', () => {
    const expected = response();
    sendApiFailure(expected.res, new ApiRequestError(413, 'Too large'), 'test');
    expect(expected.res.status).toHaveBeenCalledWith(413);
    expect(expected.json).toHaveBeenCalledWith({ error: 'Too large' });

    const generic = response();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sendApiFailure(generic.res, new Error('database secret'), 'test', 'Request failed.');
    expect(generic.res.status).toHaveBeenCalledWith(500);
    expect(generic.json).toHaveBeenCalledWith({ error: 'Request failed.' });
    consoleError.mockRestore();
  });
});
