import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  scripts?: Record<string, string>;
};

type PerformanceBudget = {
  pwaPrecacheMb?: number;
  pwaPrecacheEntries?: number;
};

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readRepoFile(...parts)) as T;
}

function expectContainsAll(source: string, fragments: string[]) {
  for (const fragment of fragments) {
    expect(source, `expected source to contain: ${fragment}`).toContain(fragment);
  }
}

function expectScriptContains(
  scripts: Record<string, string>,
  name: string,
  fragments: string[],
) {
  const command = scripts[name];
  expect(command, `missing package script: ${name}`).toBeTypeOf('string');
  expectContainsAll(command, fragments);
}

describe('release gate hardening', () => {
  it('keeps package scripts wired to the release-candidate ladder', () => {
    const scripts = readJson<PackageJson>('package.json').scripts ?? {};

    expectScriptContains(scripts, 'lint', ['lint:types', 'lint:deps', 'lint:structure']);
    expectScriptContains(scripts, 'lint:types', ['tsconfig.check.json', 'tsconfig.api-check.json']);
    expectScriptContains(scripts, 'lint:deps', ['noUndeclaredDependencies']);
    expectScriptContains(scripts, 'prebuild', ['scripts/enforce-build.js']);
    expectScriptContains(scripts, 'build', ['vite build']);
    expectScriptContains(scripts, 'test', ['vitest run']);
    expectScriptContains(scripts, 'hardening:gates', ['check-production-hardening.mjs']);
    expectScriptContains(scripts, 'qe:routes', ['playwright.qe-smoke.config.ts']);
    expectScriptContains(scripts, 'qe:master', [
      'qe:routes',
      'test:screenshots',
      'capture:page-references',
    ]);
    expectScriptContains(scripts, 'qemaster', ['qe:master']);
    expectScriptContains(scripts, 'perf:gates', [
      'check-bundle-budget.mjs',
      'check-pwa-precache.mjs',
    ]);
  });

  it('keeps Core CI aligned with install, hardening, artifact, performance, and test gates', () => {
    const ci = readRepoFile('.github', 'workflows', 'ci.yml');

    expectContainsAll(ci, [
      'name: Core CI',
      'permissions:',
      'contents: read',
      'pnpm install --frozen-lockfile',
      'pnpm run lint',
      'pnpm run hardening:gates',
      'pnpm run build',
      'name: Artifact security',
      'check-dist-security.mjs',
      'name: Performance budgets',
      'pnpm run perf:gates',
      'pnpm run test',
    ]);
  });

  it('keeps QE route smoke isolated from stale local preview servers by default', () => {
    const qeConfig = readRepoFile('playwright.qe-smoke.config.ts');

    expectContainsAll(qeConfig, [
      "process.env.PLAYWRIGHT_REUSE_SERVER === '1'",
      'reuseExistingServer',
      "VITE_E2E_ALLOW_LOCAL_ACCESS: 'true'",
      "VITE_ALLOW_LOCAL_DEMO: ''",
      "VITE_PRICING_PAGE_ENABLED: 'true'",
    ]);
  });

  it('keeps route-optional heavy media out of the PWA precache', () => {
    const viteConfig = readRepoFile('vite.config.ts');
    const checker = readRepoFile('scripts', 'performance', 'check-pwa-precache.mjs');
    const budget = readJson<PerformanceBudget>(
      'scripts',
      'performance',
      'bundle-budget.json',
    );

    expect(viteConfig).not.toContain('includeAssets:');
    expectContainsAll(viteConfig, [
      "'**/textures/**'",
      "'**/models/**'",
      "'**/hdri/**'",
      "'**/audio/**'",
      "'**/splash/**'",
      "cacheName: 'textures'",
      "cacheName: 'models'",
      "cacheName: 'hdri'",
    ]);
    expectContainsAll(checker, [
      'precacheAndRoute(',
      'forbiddenPrefixes',
      'duplicate URLs',
      'pwaPrecacheMb',
      'pwaPrecacheEntries',
    ]);
    expect(budget.pwaPrecacheMb).toBeGreaterThan(0);
    expect(budget.pwaPrecacheEntries).toBeGreaterThan(0);
  });

  it('does not preload route-optional heavy modules from the HTML entry', () => {
    const viteConfig = readRepoFile('vite.config.ts');

    expectContainsAll(viteConfig, [
      'optionalEntryPreloadFragments',
      'filterEntryModulePreloads',
      "hostType !== 'html'",
      "'vendor-3d-'",
      "'vendor-charts-'",
      "'vendor-collab-'",
      'resolveDependencies',
    ]);
  });

  it('keeps deploy source maps opt-in and scans artifacts for secret leakage', () => {
    const viteConfig = readRepoFile('vite.config.ts');
    const scanner = readRepoFile('scripts', 'security', 'check-dist-security.mjs');

    expectContainsAll(viteConfig, [
      "process.env.VISH_BUILD_SOURCEMAPS === 'true'",
      "sourcemap: buildSourceMaps ? 'hidden' : false",
    ]);
    expectContainsAll(scanner, [
      'forbiddenSecretPatterns',
      'service_role',
      'productionQaMarkers',
      'source maps are present',
    ]);
  });

  it('keeps test-only Radix and cmdk shims scoped to Vitest', () => {
    const vitestConfig = readRepoFile('vitest.config.ts');
    const packageJson = readRepoFile('package.json');

    expectContainsAll(vitestConfig, [
      "cmdk: path.resolve(__dirname, './src/test/mocks/cmdk.tsx')",
      "'@radix-ui/react-dialog': path.resolve(__dirname, './src/test/mocks/radix-dialog.tsx')",
      "'@radix-ui/react-popover': path.resolve(__dirname, './src/test/mocks/radix-popover.tsx')",
      "'@/components/ui/dialog': path.resolve(__dirname, './src/test/mocks/dialog.tsx')",
      "'@/components/ui/popover': path.resolve(__dirname, './src/test/mocks/popover.tsx')",
    ]);

    expect(packageJson).not.toContain('src/test/mocks/');
  });

  it('keeps runtime startup enforcement stricter in production than E2E builds', () => {
    const main = readRepoFile('src', 'main.tsx');

    expectContainsAll(main, [
      "const isE2eBuild = import.meta.env.MODE === 'e2e'",
      'if (isE2eBuild || import.meta.env.DEV)',
      "mode: 'production'",
      'enableAutoRepair: false',
      'requestIdleCallback',
    ]);
  });

  it('keeps Google SSO as the only accepted provider without duplicating tokens', () => {
    const authGateway = readRepoFile(
      'src',
      'backend',
      'supabase',
      'supabaseAuthGateway.ts',
    );

    expectContainsAll(authGateway, [
      "const REQUIRED_AUTH_PROVIDER = 'google'",
      'export function isGoogleSupabaseUser',
      'assertGoogleSupabaseUser(user)',
      'Vishvakarma.OS only accepts Google SSO sessions through Supabase',
      'clearLegacyTokenSnapshot',
      'Supabase remains the single',
    ]);
    expect(authGateway).not.toContain('idToken: string;');
    expect(authGateway).not.toContain('refreshToken: string;');
    expect(authGateway).not.toContain('storage.setItem(SUPABASE_SESSION_KEY');
  });

  it('closes the headless 3D proof before opening export', () => {
    const qeSmoke = readRepoFile('e2e', 'qe-production-route-smoke.spec.ts');
    const testStart = qeSmoke.indexOf("test('full editor critical path");
    const testEnd = qeSmoke.indexOf("test('lite editor recovery path", testStart);
    const criticalPath = qeSmoke.slice(testStart, testEnd);

    expect(testStart).toBeGreaterThanOrEqual(0);
    expect(testEnd).toBeGreaterThan(testStart);
    expectContainsAll(criticalPath, [
      'await expect3DPreviewPane(page)',
      'await close3DPreviewAfterProof(page)',
      'await openExportDialog(page)',
    ]);
    expect(criticalPath.indexOf('await close3DPreviewAfterProof(page)')).toBeLessThan(
      criticalPath.indexOf('await openExportDialog(page)'),
    );
  });
});
