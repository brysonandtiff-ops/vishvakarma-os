import type { IncomingMessage } from 'node:http';
import {
  CANONICAL_ORIGIN,
  VERCEL_FALLBACK_ORIGIN,
} from '../../src/config/canonicalOrigin';

type RequestWithHeaders = IncomingMessage & {
  headers: Record<string, string | string[] | undefined>;
};

type OriginEnvironment = Pick<NodeJS.ProcessEnv, 'APP_URL' | 'VERCEL'>;

const VERCEL_TEAM_SUFFIX = '-tyrasic-creations.vercel.app';
const PROJECT_PREVIEW_PREFIXES = ['vishvakarma-', 'vishvakarma-os-'];
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export class UntrustedAppOriginError extends Error {
  constructor() {
    super('Request origin is not allowed.');
    this.name = 'UntrustedAppOriginError';
  }
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrigin(value: string | null | undefined): URL | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

function isProjectPreviewHost(hostname: string) {
  return (
    hostname.endsWith(VERCEL_TEAM_SUFFIX) &&
    PROJECT_PREVIEW_PREFIXES.some((prefix) => hostname.startsWith(prefix))
  );
}

export function isTrustedAppOrigin(
  value: string | null | undefined,
  env: OriginEnvironment = process.env,
): boolean {
  const url = parseOrigin(value);
  if (!url) return false;

  const configuredAppUrl = parseOrigin(env.APP_URL);
  const trustedOrigins = new Set([
    CANONICAL_ORIGIN,
    VERCEL_FALLBACK_ORIGIN,
    configuredAppUrl?.origin,
  ].filter((origin): origin is string => Boolean(origin)));

  if (trustedOrigins.has(url.origin)) return true;

  if (url.protocol === 'https:' && isProjectPreviewHost(url.hostname)) {
    return true;
  }

  return env.VERCEL !== '1' && LOCAL_HOSTS.has(url.hostname);
}

function requireTrustedOrigin(
  value: string,
  env: OriginEnvironment,
): string {
  const parsed = parseOrigin(value);
  if (!parsed || !isTrustedAppOrigin(parsed.origin, env)) {
    throw new UntrustedAppOriginError();
  }
  return parsed.origin;
}

export function resolveTrustedAppOrigin(
  req: RequestWithHeaders,
  body: Record<string, unknown> = {},
  env: OriginEnvironment = process.env,
): string {
  const originHeader = firstHeaderValue(req.headers.origin)?.trim();
  if (originHeader) {
    return requireTrustedOrigin(originHeader, env);
  }

  const refererHeader = firstHeaderValue(req.headers.referer)?.trim();
  if (refererHeader) {
    return requireTrustedOrigin(refererHeader, env);
  }

  const bodyOrigin = typeof body.origin === 'string' ? body.origin.trim() : '';
  if (bodyOrigin) {
    return requireTrustedOrigin(bodyOrigin, env);
  }

  const configuredOrigin = parseOrigin(env.APP_URL);
  if (configuredOrigin && isTrustedAppOrigin(configuredOrigin.origin, env)) {
    return configuredOrigin.origin;
  }

  return CANONICAL_ORIGIN;
}
