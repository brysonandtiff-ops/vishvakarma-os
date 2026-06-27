import { describe, expect, it, vi } from 'vitest';

describe('operatorChrome config', () => {
  it('is enabled in dev by default', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_OPERATOR_CHROME_ENABLED', '');
    vi.resetModules();
    const { OPERATOR_CHROME_ENABLED } = await import('@/config/operatorChrome');
    expect(OPERATOR_CHROME_ENABLED).toBe(true);
    vi.unstubAllEnvs();
  });

  it('is disabled in production unless explicitly enabled', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_OPERATOR_CHROME_ENABLED', '');
    vi.resetModules();
    const { OPERATOR_CHROME_ENABLED } = await import('@/config/operatorChrome');
    expect(OPERATOR_CHROME_ENABLED).toBe(false);
    vi.unstubAllEnvs();
  });

  it('can be forced on in production via env flag', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_OPERATOR_CHROME_ENABLED', 'true');
    vi.resetModules();
    const { OPERATOR_CHROME_ENABLED } = await import('@/config/operatorChrome');
    expect(OPERATOR_CHROME_ENABLED).toBe(true);
    vi.unstubAllEnvs();
  });
});
