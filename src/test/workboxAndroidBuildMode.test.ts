import { describe, expect, it } from 'vitest';
import { resolveWorkboxBuildMode } from '../../config/workboxBuildMode';
import { readFileSync } from 'node:fs';

// Android compatibility cannot silently weaken Cloudflare production builds.
describe('Workbox local Android build compatibility', () => {
  it('uses no-worker Workbox generation only for Termux/Android', () => {
    expect(resolveWorkboxBuildMode('android')).toBe('development');
  });
  it.each(['linux', 'darwin', 'win32', 'freebsd'])('keeps production Workbox minification on %s', platform => {
    expect(resolveWorkboxBuildMode(platform)).toBe('production');
  });
  it('preserves the real PWA plugin, service-worker and offline cache configuration', () => {
    const source = readFileSync('vite.config.ts','utf8');
    expect(source).toContain('VitePWA({');
    expect(source).toContain('mode: resolveWorkboxBuildMode(process.platform)');
    expect(source).toContain('disableDevLogs: true');
    expect(source).toContain('skipWaiting: true');
    expect(source).toContain('clientsClaim: true');
    expect(source).toContain('globPatterns:');
    expect(source).toContain('runtimeCaching:');
  });
});
