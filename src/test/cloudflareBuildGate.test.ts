import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Cloudflare Pages build gate', () => {
  it('pins the Pages output and Worker compatibility contract', () => {
    const config = JSON.parse(read('wrangler.jsonc')) as {
      name?: string;
      pages_build_output_dir?: string;
      compatibility_flags?: string[];
    };

    expect(config.name).toBe('vishvakarma-os');
    expect(config.pages_build_output_dir).toBe('./dist');
    expect(config.compatibility_flags).toContain('nodejs_compat');
  });

  it('routes only API requests through Pages Functions', () => {
    const routes = JSON.parse(read('public/_routes.json')) as {
      version?: number;
      include?: string[];
      exclude?: string[];
    };

    expect(routes.version).toBe(1);
    expect(routes.include).toEqual(['/api/*']);
    expect(routes.exclude).toEqual([]);
  });

  it('keeps API and service-worker cache policies fail-closed', () => {
    const headers = read('public/_headers');
    expect(headers).toContain('/build-meta.json');
    expect(headers).toContain('no-store, max-age=0, must-revalidate');
    expect(headers).toContain('/sw.js');
    expect(headers).toContain('public, max-age=0, must-revalidate');
    expect(headers).toContain('Service-Worker-Allowed: /');
  });

  it('runs the Cloudflare release checks in a safe order', () => {
    const certifier = read('scripts/deployment/certify-cloudflare-release.mjs');
    const configCheck = certifier.indexOf('scripts/deployment/verify-cloudflare-config.mjs');
    const headerCheck = certifier.indexOf('scripts/quality/check-cloudflare-security.mjs');
    const typecheck = certifier.indexOf("['run', 'lint:types']");
    const build = certifier.indexOf("['run', 'build']");
    const artifactSecurity = certifier.indexOf('scripts/security/check-dist-security.mjs');
    const liveCheck = certifier.indexOf('scripts/deployment/verify-cloudflare-live.mjs');

    expect(configCheck).toBeGreaterThan(-1);
    expect(configCheck).toBeLessThan(headerCheck);
    expect(headerCheck).toBeLessThan(typecheck);
    expect(typecheck).toBeLessThan(build);
    expect(build).toBeLessThan(artifactSecurity);
    expect(artifactSecurity).toBeLessThan(liveCheck);
  });
});
