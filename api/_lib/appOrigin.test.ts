import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ORIGIN,
  CLOUDFLARE_PAGES_ORIGIN,
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
  it('accepts canonical and Cloudflare Pages production origins', () => {
    const env = { APP_URL: undefined, CF_PAGES: '1' };

    expect(isTrustedAppOrigin(CANONICAL_ORIGIN, env)).toBe(true);
    expect(isTrustedAppOrigin(CLOUDFLARE_PAGES_ORIGIN, env)).toBe(true);
  });

  it('accepts only the Vishvakarma Cloudflare Pages project and its previews', () => {
    const env = { APP_URL: undefined, CF_PAGES: '1' };

    expect(isTrustedAppOrigin(CLOUDFLARE_PAGES_ORIGIN, env)).toBe(true);
    expect(
      isTrustedAppOrigin('https://7f31a2b4.vishvakarma-os.pages.dev', env),
    ).toBe(true);
    expect(isTrustedAppOrigin('https://attacker.pages.dev', env)).toBe(false);
    expect(
      isTrustedAppOrigin('https://vishvakarma-os.pages.dev.attacker.example', env),
    ).toBe(false);
  });

  it('accepts an exact Cloudflare Pages URL supplied by the platform', () => {
    const env = {
      APP_URL: undefined,
      CF_PAGES: '1',
      CF_PAGES_URL: 'https://feature-branch.example-project.pages.dev',
    };

    expect(
      isTrustedAppOrigin('https://feature-branch.example-project.pages.dev', env),
    ).toBe(true);
    expect(isTrustedAppOrigin('https://other.example-project.pages.dev', env)).toBe(false);
  });

  it('allows local development origins only outside hosted production', () => {
    expect(
      isTrustedAppOrigin('http://127.0.0.1:5173', { APP_URL: undefined, CF_PAGES: undefined }),
    ).toBe(true);
    expect(
      isTrustedAppOrigin('http://localhost:4173', { APP_URL: undefined, CF_PAGES: '1' }),
    ).toBe(false);
  });

  it('rejects lookalike, credential-bearing, and non-http origins', () => {
    const env = { APP_URL: undefined, CF_PAGES: '1' };

    expect(isTrustedAppOrigin('https://vishvakarma-os.app.attacker.example', env)).toBe(false);
    expect(isTrustedAppOrigin('https://user:pass@vishvakarma-os.app', env)).toBe(false);
    expect(isTrustedAppOrigin('javascript:alert(1)', env)).toBe(false);
  });

  it('uses the trusted Origin header ahead of body data', () => {
    const origin = resolveTrustedAppOrigin(
      request({ origin: CANONICAL_ORIGIN }),
      { origin: 'https://attacker.example' },
      { APP_URL: undefined, CF_PAGES: '1' },
    );

    expect(origin).toBe(CANONICAL_ORIGIN);
  });

  it('rejects an explicit untrusted request origin even with a trusted body fallback', () => {
    expect(() =>
      resolveTrustedAppOrigin(
        request({ origin: 'https://attacker.example' }),
        { origin: CANONICAL_ORIGIN },
        { APP_URL: undefined, CF_PAGES: '1' },
      ),
    ).toThrow(UntrustedAppOriginError);
  });

  it.each(['not a URL', 'javascript:alert(1)', 'https://user:pass@vishvakarma-os.app'])(
    'rejects a malformed explicit Origin header: %s',
    (origin) => {
      expect(() =>
        resolveTrustedAppOrigin(
          request({ origin }),
          {},
          { APP_URL: undefined, CF_PAGES: '1' },
        ),
      ).toThrow(UntrustedAppOriginError);
    },
  );

  it('ignores a malformed APP_URL and falls back to the canonical origin', () => {
    expect(
      resolveTrustedAppOrigin(
        request(),
        {},
        { APP_URL: 'not a URL', CF_PAGES: '1' },
      ),
    ).toBe(CANONICAL_ORIGIN);
  });

  it('falls back to the canonical origin when no request origin is available', () => {
    expect(
      resolveTrustedAppOrigin(
        request(),
        {},
        { APP_URL: undefined, CF_PAGES: '1' },
      ),
    ).toBe(CANONICAL_ORIGIN);
  });
});
