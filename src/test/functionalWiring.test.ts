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
      '/', '/features', ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []),
      '/auth', '/reset-password', '/cast/:token', '/404', '/terms', '/privacy',
      '/editor', '/editor-lite', '/3d-room', '/projects', '/optimization', '/profile',
      '/spec-center', '/registry', '/change-requests', '/releases', '/world-records', '/audit',
    ];
    const actualRoutes = routes.map((route) => route.path);
    expect(actualRoutes).toEqual(expectedRoutes);
    expect(new Set(actualRoutes).size).toBe(actualRoutes.length);
    for (const path of ['/', '/features', ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []), '/auth', '/reset-password', '/cast/:token', '/404', '/terms', '/privacy']) {
      expect(routes.find((route) => route.path === path)?.access).toBe('public');
    }
    for (const route of routes.filter((route) => route.access === 'private')) {
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
    for (const fragment of ["route.access === 'private'", 'isProtectedRoute', "navigate('/auth'", 'state: { from: location.pathname }', 'allowLocalAccess', 'isE2eAuthGateBuild', 'showServiceConfigBanner', 'import.meta.env.PROD', 'hasCachedAuthSession', 'awaitingAuth', 'restoringSession', 'SESSION_BOOT_TIMEOUT_MS', 'clearSupabaseSessionSnapshot', 'session-restore-timeout', 'if (awaitingAuth && !publicRoute)', 'if (gated && !awaitingAuth && !user && !publicRoute', '<Navigate to="/auth"']) {
      expect(routeGuard).toContain(fragment);
    }
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
    expect(main).toContain('./styles/vish-auth-email-fallback.css');
    expect(authStyles).toContain("import '../vish-auth-gate.css'");
    expect(authStyles).toContain("import '../vish-login-page.css'");
    expect(editorStyles).toContain("import '../vish-mockup-system.css'");
    expect(appRoutes).toContain("import('@/styles/entries/auth')");
    expect(appRoutes).toContain("import('@/styles/entries/editor')");
    expect(main).toContain('bootstrapClientGovernanceState');
    expect(main).toContain('blockOnFailure: false');
    expect(main).toContain('import.meta.env.PROD');
  });

  it('keeps branded Supabase account creation, sign-in, and recovery surfaces', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    const reset = read('src/pages/ResetPasswordPage.tsx');
    const lifecycle = read('src/backend/supabase/supabaseAccountLifecycle.ts');
    const authHeader = read('src/components/auth/AuthSignInHeader.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const html = read('index.html');

    expect(card).toContain('OFFICIAL_LOGO_SRC');
    expect(authHeader).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).not.toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).not.toContain('SessionBootScreen');
    expect(html).not.toContain('boot-splash');
    expect(authPage).toContain('handleSupabaseSignIn');
    expect(authPage).toContain('handleCreateAccount');
    expect(authPage).toContain('handleForgotPassword');
    expect(card).toContain('supabase-auth-badge');
    expect(card).toContain('supabase-create-account-button');
    expect(card).toContain('supabase-forgot-password-button');
    expect(reset).toContain('recovery-update-password-button');
    expect(lifecycle).toContain('client.auth.signUp');
    expect(lifecycle).toContain('client.auth.resetPasswordForEmail');
    expect(lifecycle).toContain('client.auth.updateUser');
    expect(card).not.toContain('google-sso-button');
    expect(card).not.toContain('email-magic-link-button');
    expect(authPage).toContain('auth-trust-pillars');
    expect(appLayout).toContain('VISHVAKARMA.OS');
    expect(appLayout).toContain('PrototypeDisclaimerBadge');
  });
});
