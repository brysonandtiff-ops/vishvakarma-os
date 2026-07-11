import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

type VercelConfig = {
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  headers?: HeaderRule[];
};

function headerMap(config: VercelConfig, source: string) {
  const rule = config.headers?.find((candidate) => candidate.source === source);
  return new Map(rule?.headers.map(({ key, value }) => [key, value]) ?? []);
}

describe('Vercel build gate', () => {
  it('uses a short config command and runs focused quality gates in order', () => {
    const root = process.cwd();
    const config = JSON.parse(
      readFileSync(path.join(root, 'vercel.json'), 'utf8'),
    ) as VercelConfig;
    const orchestrator = readFileSync(
      path.join(root, 'scripts', 'vercel-build.mjs'),
      'utf8',
    );

    expect(config.installCommand).toContain('pnpm install --frozen-lockfile');
    expect(config.buildCommand).toBe('node scripts/vercel-build.mjs');
    expect(config.outputDirectory).toBe('dist');

    expect(orchestrator).toContain("process.env.VERCEL === '1'");
    expect(orchestrator).toContain('skipping destructive texture cleanup');
    expect(orchestrator).toContain('pnpm run lint');
    expect(orchestrator).toContain('pnpm run hardening:gates');
    expect(orchestrator).toContain('src/test/releaseGateHardening.test.ts');
    expect(orchestrator).toContain('src/test/vercelBuildGate.test.ts');
    expect(orchestrator).toContain('src/test/qaToolsGate.test.ts');
    expect(orchestrator).toContain('src/backend/supabase/supabaseAuthCallback.test.ts');
    expect(orchestrator).toContain('src/backend/supabase/mappers.test.ts');
    expect(orchestrator).toContain('src/services/billing/stripeCheckout.test.ts');
    expect(orchestrator).toContain('api/_lib/appOrigin.test.ts');
    expect(orchestrator).toContain('api/_lib/verifySupabaseToken.test.ts');
    expect(orchestrator).toContain('api/stripe/create-checkout-session.test.ts');
    expect(orchestrator).toContain('api/stripe/webhook.test.ts');
    expect(orchestrator).toContain('pnpm run build');
    expect(orchestrator).toContain('scripts/security/check-dist-security.mjs');
    expect(orchestrator).toContain('pnpm run perf:gates');

    expect(orchestrator.indexOf("label: 'Lint'")).toBeLessThan(
      orchestrator.indexOf("label: 'Production hardening'"),
    );
    expect(orchestrator.indexOf("label: 'Production hardening'")).toBeLessThan(
      orchestrator.indexOf("label: 'Focused regression tests'"),
    );
    expect(orchestrator.indexOf("label: 'Focused regression tests'")).toBeLessThan(
      orchestrator.indexOf("label: 'Production build'"),
    );
    expect(orchestrator.indexOf("label: 'Production build'")).toBeLessThan(
      orchestrator.indexOf("label: 'Artifact security'"),
    );
    expect(orchestrator.indexOf("label: 'Artifact security'")).toBeLessThan(
      orchestrator.indexOf("label: 'Performance budgets'"),
    );
  });

  it('prevents caching of APIs and forces service-worker revalidation', () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
    ) as VercelConfig;

    const apiHeaders = headerMap(config, '/api/(.*)');
    expect(apiHeaders.get('Cache-Control')).toContain('no-store');
    expect(apiHeaders.get('Pragma')).toBe('no-cache');
    expect(apiHeaders.get('X-Content-Type-Options')).toBe('nosniff');

    const serviceWorkerHeaders = headerMap(config, '/sw.js');
    expect(serviceWorkerHeaders.get('Cache-Control')).toContain('must-revalidate');
    expect(serviceWorkerHeaders.get('Service-Worker-Allowed')).toBe('/');
  });

  it('keeps baseline browser isolation and content security headers enabled', () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
    ) as VercelConfig;
    const headers = headerMap(config, '/(.*)');

    expect(headers.get('Content-Security-Policy')).toContain("object-src 'none'");
    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('Strict-Transport-Security')).toContain('includeSubDomains');
    expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
  });
});
