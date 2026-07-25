import { Buffer } from 'node:buffer';
import type {
  SecureApiRequest,
  SecureApiResponse,
} from '../api/_lib/httpSecurity';

type StreamListener = (...args: unknown[]) => void;

export type VercelStyleRequest = SecureApiRequest & {
  on?: (event: string, listener: StreamListener) => void;
};

export type VercelStyleHandler = (
  req: VercelStyleRequest,
  res: SecureApiResponse,
) => unknown | Promise<unknown>;

function requestHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, name) => {
    headers[name.toLowerCase()] = value;
  });
  return headers;
}

async function requestBody(request: Request): Promise<Buffer | undefined> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return undefined;
  return Buffer.from(await request.arrayBuffer());
}

/**
 * Runs the existing hardened Vercel-style API handlers inside a Cloudflare
 * Pages Function. The raw request bytes are preserved so Stripe signature
 * verification and the existing bounded-body guards keep their semantics.
 */
export async function runVercelHandler(
  request: Request,
  handler: VercelStyleHandler,
): Promise<Response> {
  const responseHeaders = new Headers({
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  let statusCode = 200;
  let responseBody: string | null = null;
  let responseSent = false;

  const response = {} as SecureApiResponse;
  response.status = (code: number) => {
    statusCode = code;
    return response;
  };
  response.setHeader = (name: string, value: string) => {
    responseHeaders.set(name, value);
  };
  response.json = (value: unknown) => {
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
    responseBody = JSON.stringify(value);
    responseSent = true;
  };

  const req = {
    method: request.method,
    url: request.url,
    headers: requestHeaders(request),
    body: await requestBody(request),
  } as VercelStyleRequest;

  try {
    await handler(req, response);
  } catch (error) {
    console.error('[cloudflare/api-adapter] Unhandled API failure', error);
    statusCode = 500;
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
    responseBody = JSON.stringify({ error: 'The request could not be completed.' });
    responseSent = true;
  }

  if (!responseSent) {
    statusCode = statusCode === 200 ? 204 : statusCode;
  }

  if (request.method.toUpperCase() === 'HEAD' || statusCode === 204) {
    responseBody = null;
  }

  return new Response(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}
