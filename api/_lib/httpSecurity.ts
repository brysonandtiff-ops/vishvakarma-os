import type { IncomingMessage } from 'node:http';

export type SecureApiRequest = IncomingMessage & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type SecureApiResponse = {
  status: (code: number) => SecureApiResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 32 * 1024;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly publicMessage: string;

  constructor(status: number, publicMessage: string) {
    super(publicMessage);
    this.name = 'ApiRequestError';
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export function applyApiSecurityHeaders(res: SecureApiResponse) {
  res.setHeader?.('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader?.('Pragma', 'no-cache');
  res.setHeader?.('X-Content-Type-Options', 'nosniff');
}

export function enforceApiMethod(
  req: SecureApiRequest,
  res: SecureApiResponse,
  allowedMethods: readonly string[],
) {
  const method = req.method?.toUpperCase() ?? '';
  if (allowedMethods.includes(method)) return true;

  res.setHeader?.('Allow', allowedMethods.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
  return false;
}

function serializeJsonBody(value: unknown): string {
  try {
    const serialized = JSON.stringify(value ?? {});
    if (typeof serialized !== 'string') {
      throw new ApiRequestError(400, 'Request body must be JSON serializable.');
    }
    return serialized;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(400, 'Request body must be JSON serializable.');
  }
}

function byteLength(value: unknown) {
  if (typeof value === 'string') return Buffer.byteLength(value);
  if (Buffer.isBuffer(value)) return value.byteLength;
  return Buffer.byteLength(serializeJsonBody(value));
}

export function parseBoundedJsonBody(
  req: SecureApiRequest,
  maxBytes = DEFAULT_JSON_BODY_LIMIT_BYTES,
): Record<string, unknown> {
  if (byteLength(req.body) > maxBytes) {
    throw new ApiRequestError(413, 'Request body is too large.');
  }

  if (req.body === undefined || req.body === null || req.body === '') return {};

  let parsed: unknown = req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    try {
      parsed = JSON.parse(req.body.toString());
    } catch {
      throw new ApiRequestError(400, 'Request body is not valid JSON.');
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiRequestError(400, 'Request body must be a JSON object.');
  }

  return parsed as Record<string, unknown>;
}

export function sendApiFailure(
  res: SecureApiResponse,
  error: unknown,
  context: string,
  fallback = 'The request could not be completed.',
) {
  if (error instanceof ApiRequestError) {
    return res.status(error.status).json({ error: error.publicMessage });
  }

  console.error(`[api/${context}]`, error);
  return res.status(500).json({ error: fallback });
}
