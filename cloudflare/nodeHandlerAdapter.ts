import { Buffer } from 'node:buffer';
import type {
  SecureApiRequest,
  SecureApiResponse,
} from '../api/_lib/httpSecurity';

type StreamListener = (...args: unknown[]) => void;

export type NodeStyleRequest = SecureApiRequest & {
  on?: (event: string, listener: StreamListener) => void;
};

export type NodeStyleHandler = (
  req: NodeStyleRequest,
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
 * Runs the existing hardened Node-style API handlers inside a Cloudflare Pages
 * Function while preserving raw request bytes for signed webhooks and bounded
 * request-body guards.
 */
export async function runNodeHandler(
  request: Request,
  handler: NodeStyleHandler,
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
  } as NodeStyleRequest;

  try {
    await handler(req, response);
  } catch (error) {
    console.error('[cloudflare/api-adapter] Unhandled API failure', error);
    statusCode = 500;
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
    responseBody = JSON.stringify({ error: 'The request could not be completed.' });
    responseSent = true;
  }

  if (!responseSent) statusCode = statusCode === 200 ? 204 : statusCode;
  if (request.method.toUpperCase() === 'HEAD' || statusCode === 204) responseBody = null;

  return new Response(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}
