import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  redactMonitoringUrl,
  sanitizeMonitoringContext,
} from '@/lib/monitoring';

describe('monitoring privacy', () => {
  it('removes query parameters and hashes from captured URLs', () => {
    expect(
      redactMonitoringUrl(
        'https://vishvakarma-os.app/auth?code=oauth-secret&state=abc#access_token=secret',
      ),
    ).toBe('https://vishvakarma-os.app/auth');
  });

  it('redacts sensitive keys and credential-shaped values', () => {
    const context = sanitizeMonitoringContext({
      projectId: 'project-1',
      authorization: 'Bearer secret-token',
      refreshToken: 'secret',
      opaque: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature',
      note: 'safe',
    });

    expect(context).toEqual({
      projectId: 'project-1',
      authorization: '[redacted]',
      refreshToken: '[redacted]',
      opaque: '[redacted]',
      note: 'safe',
    });
  });

  it('truncates oversized diagnostic strings', () => {
    const context = sanitizeMonitoringContext({ detail: 'x'.repeat(600) });
    const detail = String(context?.detail);
    expect(detail).toHaveLength(501);
    expect(detail.endsWith('…')).toBe(true);
  });

  it('keeps Sentry behind a dynamic production-only import', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src', 'lib', 'monitoring.ts'),
      'utf8',
    );

    expect(source).toContain("import('@sentry/react')");
    expect(source).toContain('sendDefaultPii: false');
    expect(source).toContain('beforeSend');
    expect(source).toContain('beforeBreadcrumb');
    expect(source).not.toContain("import * as Sentry from '@sentry/react'");
  });
});
