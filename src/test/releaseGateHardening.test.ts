import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type PackageJson = {
  engines?: Record<string, string>;
  packageManager?: string;
  scripts?: Record<string, string>;
};

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

function readPackageJson(): PackageJson {
  return JSON.parse(readRepoFile('package.json')) as PackageJson;
}

describe('release gate hardening', () => {
  it('keeps package scripts wired to the full release-candidate ladder', () => {
    const scripts = readPackageJson().scripts ?? {};

    expect(scripts.lint).toBe('pnpm run lint:types && pnpm run lint:deps && pnpm run lint:structure');
    expect(scripts['lint:types']).toContain('tsgo -p tsconfig.check.json');
    expect(scripts['lint:types']).toContain('tsgo -p tsconfig.api-check.json');
    expect(scripts['lint:deps']).toContain('biome lint --only=correctness/noUndeclaredDependencies');
    expect(scripts['lint:structure']).toBe('ast-grep scan');

    expect(scripts.prebuild).toBe('node --import tsx scripts/enforce-build.js');
    expect(scripts.build).toBe('vite build');
    expect(scripts.test).toBe('vitest run');

    expect(scripts['qe:routes']).toBe('pnpm exec playwright test --config=playwright.qe-smoke.config.ts');
    expect(scripts['qe:master']).toBe('pnpm run qe:routes && pnpm run test:screenshots && pnpm run capture:page-references');
    expect(scripts.qemaster).toBe('pnpm run qe:master');
  });

  it('keeps CI aligned with install, lint, build, and unit test gates', () => {
    const ci = readRepoFile('.github', 'workflows', 'ci.yml');

    expect(ci).toContain('name: Core CI');
    expect(ci).toContain('pnpm install --frozen-lockfile');
    expect(ci).toContain('pnpm run lint');
    expect(ci).toContain('pnpm run build');
    expect(ci).toContain('pnpm run test');
  });

  it('keeps QE route smoke isolated from stale local preview servers by default', () => {
    const qeConfig = readRepoFile('playwright.qe-smoke.config.ts');

    expect(qeConfig).toContain("const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1'");
    expect(qeConfig).toContain('reuseExistingServer');
    expect(qeConfig).toContain("VITE_E2E_ALLOW_LOCAL_ACCESS: 'true'");
    expect(qeConfig).toContain("VITE_ALLOW_LOCAL_DEMO: ''");
    expect(qeConfig).toContain("VITE_PRICING_PAGE_ENABLED: 'true'");
  });

  it('keeps test-only Radix and cmdk shims scoped to Vitest only', () => {
    const vitestConfig = readRepoFile('vitest.config.ts');
    const packageJson = readRepoFile('package.json');

    expect(vitestConfig).toContain("cmdk: path.resolve(__dirname, './src/test/mocks/cmdk.tsx')");
    expect(vitestConfig).toContain("'@radix-ui/react-dialog': path.resolve(__dirname, './src/test/mocks/radix-dialog.tsx')");
    expect(vitestConfig).toContain("'@radix-ui/react-popover': path.resolve(__dirname, './src/test/mocks/radix-popover.tsx')");
    expect(vitestConfig).toContain("'@/components/ui/dialog': path.resolve(__dirname, './src/test/mocks/dialog.tsx')");
    expect(vitestConfig).toContain("'@/components/ui/popover': path.resolve(__dirname, './src/test/mocks/popover.tsx')");

    expect(packageJson).not.toContain('src/test/mocks/radix-dialog.tsx');
    expect(packageJson).not.toContain('src/test/mocks/radix-popover.tsx');
    expect(packageJson).not.toContain('src/test/mocks/dialog.tsx');
    expect(packageJson).not.toContain('src/test/mocks/popover.tsx');
  });

  it('keeps runtime startup enforcement stricter in production than E2E builds', () => {
    const main = readRepoFile('src', 'main.tsx');

    expect(main).toContain("const isE2eBuild = import.meta.env.MODE === 'e2e'");
    expect(main).toContain('if (isE2eBuild || import.meta.env.DEV)');
    expect(main).toContain('mode: \'production\'');
    expect(main).toContain('enableAutoRepair: false');
    expect(main).toContain('requestIdleCallback');
  });

  it('keeps Google SSO as the only accepted Supabase session provider', () => {
    const authGateway = readRepoFile('src', 'backend', 'supabase', 'supabaseAuthGateway.ts');

    expect(authGateway).toContain("const REQUIRED_AUTH_PROVIDER = 'google'");
    expect(authGateway).toContain('export function isGoogleSupabaseUser');
    expect(authGateway).toContain('assertGoogleSupabaseUser(user)');
    expect(authGateway).toContain('Vishvakarma.OS only accepts Google SSO sessions through Supabase');
    expect(authGateway).toContain("if (parsed.authProvider !== REQUIRED_AUTH_PROVIDER) return null");
  });

  it('keeps headless QE 3D proof from accumulating WebGL contexts before export', () => {
    const qeSmoke = readRepoFile('e2e', 'qe-production-route-smoke.spec.ts');

    expect(qeSmoke).toContain('async function close3DPreviewAfterProof(page: Page)');
    expect(qeSmoke).toContain('await expect3DPreviewPane(page)');
    expect(qeSmoke).toContain('await close3DPreviewAfterProof(page)');
    expect(qeSmoke).toContain('await openExportDialog(page)');
    expect(qeSmoke.indexOf('await close3DPreviewAfterProof(page)')).toBeLessThan(qeSmoke.indexOf('await openExportDialog(page)'));
  });
});
