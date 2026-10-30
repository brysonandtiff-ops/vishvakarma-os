import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readText(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('Cloudflare Pages build gate', () => {
  it('runs the native Cloudflare quality gates in order', () => {
    const wrangler = JSON.parse(readText('wrangler.jsonc')) as {
      name?: string;
      pages_build_output_dir?: string;
      compatibility_flags?: string[];
    };
    const orchestrator = readText('scripts', 'cloudflare-build.mjs');

    expect(wrangler.name).toBe('vishvakarma-os');
    expect(wrangler.pages_build_output_dir).toBe('./dist');
    expect(wrangler.compatibility_flags).toContain('nodejs_compat');

    for (const fragment of [
      "label: 'Repository secret guard'",
      "label: 'Cloudflare configuration certification'",
      "label: 'Application and Pages runtime typecheck'",
      "label: 'Production-focused regression tests'",
      "label: 'Production build'",
      "label: 'Artifact security'",
      "label: 'Performance budgets'",
    ]) {
      expect(orchestrator).toContain(fragment);
    }

    expect(orchestrator.indexOf("label: 'Repository secret guard'")).toBeLessThan(
      orchestrator.indexOf("label: 'Cloudflare configuration certification'"),
    );
    expect(orchestrator.indexOf("label: 'Cloudflare configuration certification'")).toBeLessThan(
      orchestrator.indexOf("label: 'Application and Pages runtime typecheck'"),
    );
    expect(orchestrator.indexOf("label: 'Application and Pages runtime typecheck'")).toBeLessThan(
      orchestrator.indexOf("label: 'Production-focused regression tests'"),
    );
    expect(orchestrator.indexOf("label: 'Production-focused regression tests'")).toBeLessThan(
      orchestrator.indexOf("label: 'Production build'"),
    );
    expect(orchestrator.indexOf("label: 'Production build'")).toBeLessThan(
      orchestrator.indexOf("label: 'Artifact security'"),
    );
    expect(orchestrator.indexOf("label: 'Artifact security'")).toBeLessThan(
      orchestrator.indexOf("label: 'Performance budgets'"),
    );

    expect(orchestrator).not.toContain('process.env.VERCEL');
    expect(orchestrator).not.toContain('vercel-build');
  });

  it('routes Pages Functions only through the API path', () => {
    const routes = JSON.parse(readText('public', '_routes.json')) as {
      version?: number;
      include?: string[];
    };

    expect(routes.version).toBe(1);
    expect(routes.include).toContain('/api/*');
  });

  it('forces service-worker revalidation and keeps baseline security headers', () => {
    const headers = readText('public', '_headers');

    expect(headers).toContain('/sw.js');
    expect(headers).toContain('Cache-Control: public, max-age=0, must-revalidate');
    expect(headers).toContain('Service-Worker-Allowed: /');
    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
    expect(headers).toContain('Cross-Origin-Resource-Policy: same-origin');
    expect(headers).toContain('X-Frame-Options: DENY');
    expect(headers).toContain('X-Permitted-Cross-Domain-Policies: none');
  });
});
