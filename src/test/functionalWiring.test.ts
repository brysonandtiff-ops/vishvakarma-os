import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import routes from '@/routes';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Vishvakarma.OS functional wiring guard', () => {
  it('keeps route manifest complete and access-scoped', () => {
    const expectedRoutes = [
      '/',
      '/features',
      ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []),
      '/auth',
      '/reset-password',
      '/404',
      '/editor',
      '/projects',
      '/optimization',
      '/profile',
      '/spec-center',
      '/registry',
      '/change-requests',
      '/releases',
      '/world-records',
      '/audit',
    ];
    const actualRoutes = routes.map((route) => route.path);

    expect(actualRoutes).toEqual(expectedRoutes);
    expect(new Set(actualRoutes).size).toBe(actualRoutes.length);
    const publicPaths = [
      '/',
      '/features',
      ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []),
      '/auth',
      '/reset-password',
      '/404',
    ];
    for (const path of publicPaths) {
      expect(routes.find((route) => route.path === path)?.access).toBe('public');
    }

    const privateRoutes = routes.filter((route) => route.access === 'private');
    for (const route of privateRoutes) {
      expect(route.access).toBe('private');
      expect(route.element).toBeTruthy();
      expect(route.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps App routing driven by the canonical route manifest', () => {
    const app = read('src/App.tsx');

    expect(app).toContain('import routes from \'./routes\'');
    expect(app).toContain('routes.map((route) =>');
    expect(app).toContain('<Route key={route.path} path={route.path} element={route.element} />');
    expect(app).toContain('<Route path="*" element={<NotFound />} />');
  });

  it('keeps protected routing enforced through RouteGuard', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(routeGuard).toContain("route.access === 'private'");
    expect(routeGuard).toContain('isProtectedRoute');
    expect(routeGuard).toContain("navigate('/auth'");
    expect(routeGuard).toContain("state: { from: location.pathname }");
    expect(routeGuard).toContain('allowLocalAccess');
    expect(routeGuard).toContain('isE2eAuthGateBuild');
    expect(routeGuard).toContain('showServiceConfigBanner');
    expect(routeGuard).toContain('import.meta.env.PROD');
    expect(routeGuard).toContain('if (loading && !publicRoute)');
    expect(routeGuard).toContain('if (!user && !publicRoute)');
    expect(routeGuard).toContain('if (gated && !loading && !user && !publicRoute)');
    expect(routeGuard).toContain('<Navigate to="/auth"');
  });

  it('wires import and new-project flows in the editor', () => {
    const editor = read('src/pages/EditorPage.tsx');

    expect(editor).toContain('ImportFloorPlanDialog');
    expect(editor).toContain('onImported={handleImportedManifest}');
    expect(editor).toContain('onProjectCreated={handleProjectCreated}');
    expect(editor).toContain('onImport={() => setImportDialogOpen(true)}');
  });

  it('loads Sanskrit boot/auth styles at app startup', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-auth-gate.css');
    expect(main).toContain('bootstrapClientGovernanceState');
    expect(main).toContain('blockOnFailure: false');
    expect(main).toContain('import.meta.env.PROD');
  });

  it('keeps loading, auth, and app shell surfaces on the official brand asset', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(routeGuard).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).toContain('Checking secure session');
    expect(authPage).toContain('requestAccessLink(email)');
    expect(authPage).toContain('Send secure access link');
    expect(authPage).toContain('auth-trust-pillars');
    expect(appLayout).toContain('VISHVAKARMA.OS');
    expect(appLayout).toContain('PrototypeDisclaimerBadge');
  });
});
