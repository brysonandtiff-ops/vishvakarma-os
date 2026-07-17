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
      '/cast/:token',
      '/404',
      '/terms',
      '/privacy',
      '/editor',
      '/editor-lite',
      '/3d-room',
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
      '/cast/:token',
      '/404',
      '/terms',
      '/privacy',
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
    const appRoutes = read('src/AppRoutes.tsx');

    expect(app).toContain("import { AppRoutes } from '@/AppRoutes'");
    expect(app).toContain('<AppRoutes />');
    expect(appRoutes).toContain('path="/editor"');
    expect(appRoutes).toContain('path="/projects"');
    expect(appRoutes).toContain('path="/optimization"');
    expect(appRoutes).toContain('WorkspaceDocumentLayout');
    expect(appRoutes).toContain('WorkspaceGovernanceLayout');
    expect(appRoutes).toContain('<AuthAwareNotFound />');
  });

  it('keeps protected routing enforced through RouteGuard', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(routeGuard).toContain("route.access === 'private'");
    expect(routeGuard).toContain('isProtectedRoute');
    expect(routeGuard).toContain("navigate('/auth'");
    expect(routeGuard).toContain('state: { from: location.pathname }');
    expect(routeGuard).toContain('allowLocalAccess');
    expect(routeGuard).toContain('isE2eAuthGateBuild');
    expect(routeGuard).toContain('showServiceConfigBanner');
    expect(routeGuard).toContain('import.meta.env.PROD');
    expect(routeGuard).toContain('hasCachedAuthSession');
    expect(routeGuard).toContain('awaitingAuth');
    expect(routeGuard).toContain('restoringSession');
    expect(routeGuard).toContain('SESSION_BOOT_TIMEOUT_MS');
    expect(routeGuard).toContain('clearSupabaseSessionSnapshot');
    expect(routeGuard).toContain('session-restore-timeout');
    expect(routeGuard).toContain('if (awaitingAuth && !publicRoute)');
    expect(routeGuard).toContain('if (gated && !awaitingAuth && !user && !publicRoute');
    expect(routeGuard).toContain('<Navigate to="/auth"');
  });

  it('wires import and new-project flows in the editor', () => {
    const editor = read('src/pages/EditorPage.tsx');

    expect(editor).toContain('ImportFloorPlanDialog');
    expect(editor).toContain('onImported={handleImportedManifest}');
    expect(editor).toContain('onProjectCreated={handleProjectCreated}');
    expect(editor).toContain('onImport={() => setImportDialogOpen(true)}');
  });

  it('loads core, auth, and editor startup styles through explicit boundaries', () => {
    const main = read('src/main.tsx');
    const authStyles = read('src/styles/entries/auth.ts');
    const editorStyles = read('src/styles/entries/editor.ts');
    const appRoutes = read('src/AppRoutes.tsx');

    expect(main).toContain('./styles/vish-sacred-layers.css');
    expect(authStyles).toContain("import '../vish-auth-gate.css'");
    expect(authStyles).toContain("import '../vish-login-page.css'");
    expect(editorStyles).toContain("import '../vish-mockup-system.css'");
    expect(appRoutes).toContain("import('@/styles/entries/auth')");
    expect(appRoutes).toContain("import('@/styles/entries/editor')");
    expect(main).toContain('bootstrapClientGovernanceState');
    expect(main).toContain('blockOnFailure: false');
    expect(main).toContain('import.meta.env.PROD');
  });

  it('keeps auth and app shell surfaces on the official brand asset without a loading screen', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const authLoginCard = read('src/components/auth/AuthLoginCard.tsx');
    const authHeader = read('src/components/auth/AuthSignInHeader.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const html = read('index.html');

    expect(authLoginCard).toContain('OFFICIAL_LOGO_SRC');
    expect(authHeader).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).not.toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).not.toContain('SessionBootScreen');
    expect(html).not.toContain('boot-splash');
    expect(authPage).toContain('handleRequestAccess');
    expect(authPage).toContain('Google access required');
    expect(authLoginCard).toContain('Request access');
    expect(authPage).toContain('auth-trust-pillars');
    expect(appLayout).toContain('VISHVAKARMA.OS');
    expect(appLayout).toContain('PrototypeDisclaimerBadge');
  });
});
