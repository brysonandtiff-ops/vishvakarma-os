import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import {
  runVercelHandler,
  type VercelStyleHandler,
} from './vercelHandlerAdapter';

describe('Cloudflare Vercel handler adapter', () => {
  it('preserves request bytes, headers, status, and JSON responses', async () => {
    const handler: VercelStyleHandler = (req, res) => {
      expect(req.method).toBe('POST');
      expect(req.headers.authorization).toBe('Bearer test-token');
      expect(Buffer.isBuffer(req.body)).toBe(true);
      expect(req.body?.toString()).toBe('{"prompt":"design a studio"}');

      res.setHeader?.('X-Adapter-Test', 'passed');
      return res.status(201).json({ ok: true });
    };

    const response = await runVercelHandler(
      new Request('https://vishvakarma-os.pages.dev/api/ai/extract-requirements', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: '{"prompt":"design a studio"}',
      }),
      handler,
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('x-adapter-test')).toBe('passed');
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('suppresses a response body for HEAD requests', async () => {
    const response = await runVercelHandler(
      new Request('https://vishvakarma-os.pages.dev/api/health', { method: 'HEAD' }),
      (_req, res) => res.status(200).json({ ok: true }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('returns a generic secured response for an uncaught handler error', async () => {
    const response = await runVercelHandler(
      new Request('https://vishvakarma-os.pages.dev/api/health'),
      () => {
        throw new Error('secret internal failure');
      },
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({
      error: 'The request could not be completed.',
    });
  });
});
