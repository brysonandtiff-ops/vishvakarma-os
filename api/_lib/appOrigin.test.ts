import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ORIGIN,
  VERCEL_FALLBACK_ORIGIN,
} from '../../src/config/canonicalOrigin';
import {
  isTrustedAppOrigin,
  resolveTrustedAppOrigin,
  UntrustedAppOriginError,
} from './appOrigin';

type RequestWithHeaders = IncomingMessage & {
  headers: Record<string, string | string[] | undefined>;
};

function request(headers: RequestWithHeaders['headers'] = {}) {
  return { headers } as RequestWithHeaders;
}

describe('trusted app origin policy', () => {
  it('accepts canonical and fallback production origins', () => {
    const env = { APP_URL: undefined, VERCEL: '1' };

    expect(isTrustedAppOrigin(CANONICAL_ORIGIN, env)).toBe(true);
    expect(isTrustedAppOrigin(VERCEL_FALLBACK_ORIGIN, env)).toBe(true);
  });

  it('accepts only Vishvakarma preview hosts in the connected Vercel team', () => {
    const env = { APP_URL: undefined, VERCEL: '1' };

    expect(
      isTrustedAppOrigin(
        'https://vishvakarma-os-git-feature-abc-tyrasic-creations.vercel.app',
        env,
      ),
    ).toBe(true);
    expect(
      isTrustedAppOrigin(
        'https://vishvakarma-a1b2c3-tyrasic-creations.vercel.app',
        env,
      ),
    ).toBe(true);
    expect(isTrustedAppOrigin('https://attacker-tyrasic-creations.vercel.app', env)).toBe(false);
    expect(isTrustedAppOrigin('https://vishvakarma-os.attacker.vercel.app', env)).toBe(false);
  });

  it('allows local development origins only outside Vercel', () => {
    expect(
      isTrustedAppOrigin('http://127.0.0.1:5173', { APP_URL: undefined, VERCEL: undefined }),
    ).toBe(true);
    expect(
      isTrustedAppOrigin('http://localhost:4173', { APP_URL: undefined, VERCEL: '1' }),
    ).toBe(false);
  });

  it('rejects lookalike, credential-bearing, and non-http origins', () => {
    const env = { APP_URL: undefined, VERCEL: '1' };

    expect(isTrustedAppOrigin('https://vishvakarma-os.app.attacker.example', env)).toBe(false);
    expect(isTrustedAppOrigin('https://user:pass@vishvakarma-os.app', env)).toBe(false);
    expect(isTrustedAppOrigin('javascript:alert(1)', env)).toBe(false);
  });

  it('uses the trusted Origin header ahead of body data', () => {
    const origin = resolveTrustedAppOrigin(
      request({ origin: CANONICAL_ORIGIN }),
      { origin: 'https://attacker.example' },
      { APP_URL: undefined, VERCEL: '1' },
    );

    expect(origin).toBe(CANONICAL_ORIGIN);
  });

  it('rejects an explicit untrusted request origin even with a trusted body fallback', () => {
    expect(() =>
      resolveTrustedAppOrigin(
        request({ origin: 'https://attacker.example' }),
        { origin: CANONICAL_ORIGIN },
        { APP_URL: undefined, VERCEL: '1' },
      ),
    ).toThrow(UntrustedAppOriginError);
  });

  it('falls back to the canonical origin when no request origin is available', () => {
    expect(
      resolveTrustedAppOrigin(
        request(),
        {},
        { APP_URL: undefined, VERCEL: '1' },
      ),
    ).toBe(CANONICAL_ORIGIN);
  });
});
