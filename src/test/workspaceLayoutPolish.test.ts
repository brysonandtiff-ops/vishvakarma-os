import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Workspace layout polish', () => {
  it('loads layout tokens through app startup', () => {
    const main = read('src/main.tsx');
    expect(main).toContain('./styles/vish-layout-tokens.css');
  });

  it('uses a single workspace nav manifest', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const navConfig = read('src/config/RouteNavConfig.ts');
    const routeManifest = read('src/config/routeManifest.ts');
    const palette = read('src/components/workspace/WorkspaceCommandPalette.tsx');

    expect(appLayout).toContain('WORKSPACE_NAV');
    expect(appLayout).not.toContain("group: 'EDITOR'");
    expect(navConfig).toContain('WORKSPACE_NAV');
    expect(navConfig).toContain('ROUTE_ICONS');
    expect(routeManifest).toContain('/optimization');
    expect(palette).toContain('ROUTE_ICONS');
  });

  it('routes private pages through nested layout outlets instead of inline AppLayout', () => {
    const appRoutes = read('src/AppRoutes.tsx');
    const projects = read('src/pages/ProjectsPage.tsx');
    const optimization = read('src/pages/OptimizationPage.tsx');

    expect(appRoutes).toContain('AppLayoutOutlet');
    expect(appRoutes).toContain('WorkspaceDocumentLayout');
    expect(appRoutes).toContain('WorkspaceGovernanceLayout');
    expect(projects).not.toContain('<AppLayout');
    expect(optimization).not.toContain('<AppLayout');
  });

  it('defines page width contracts for route categories', () => {
    const routeManifest = read('src/config/routeManifest.ts');
    const shell = read('src/components/layouts/WorkspacePageShell.tsx');

    expect(routeManifest).toContain("pageWidth: 'narrow'");
    expect(routeManifest).toContain("pageWidth: 'standard'");
    expect(routeManifest).toContain("pageWidth: 'wide'");
    const pageContainer = read('src/components/common/PageContainer.tsx');
    expect(shell).toContain('WIDTH_CLASS');
    expect(pageContainer).toContain('max-w-page-narrow');
    expect(pageContainer).toContain('max-w-page-wide');
  });

  it('keeps the auth shell scoped to auth routes with no session boot variant', () => {
    const authLayout = read('src/components/layouts/AuthLayout.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(authLayout).toContain('SanskritRainBackground');
    expect(authPage).not.toContain('SanskritRainBackground');
    expect(routeGuard).not.toContain('AuthLayout');
    expect(routeGuard).not.toContain('variant="boot"');
    expect(routeGuard).not.toContain('SessionBootScreen');
  });

  it('avoids nested main landmarks in the app root', () => {
    const app = read('src/App.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(app).not.toContain('<main');
    expect(appLayout).toContain('<main');
  });

  it('keeps the workspace nav responsive and the brand lockup unclipped', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    // Inline route nav on wide viewports, drawer below — the top command bar
    // replaced the old tablet-breakpoint sidebar.
    expect(appLayout).toContain('hidden lg:flex');
    expect(appLayout).toContain('lg:hidden');

    // Regression: the brand block was `flex flex-col hidden sm:flex` with no
    // shrink guard, so the wordmark was clipped at every width below ~2200px
    // (-39px at 1440, -56px at iPad landscape). It must never be shrinkable.
    expect(appLayout).toContain('hidden shrink-0 sm:flex sm:flex-col');
    expect(appLayout).not.toContain('flex flex-col hidden sm:flex');
  });
});
