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
    const palette = read('src/components/workspace/WorkspaceCommandPalette.tsx');

    expect(appLayout).toContain('WORKSPACE_NAV');
    expect(appLayout).not.toContain("group: 'EDITOR'");
    expect(navConfig).toContain('WORKSPACE_NAV');
    expect(navConfig).toContain('ROUTE_ICONS');
    expect(navConfig).toContain('/optimization');
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
    const meta = read('src/config/RouteNavConfig.ts');
    const shell = read('src/components/layouts/WorkspacePageShell.tsx');

    expect(meta).toContain("pageWidth: 'narrow'");
    expect(meta).toContain("pageWidth: 'standard'");
    expect(meta).toContain("pageWidth: 'wide'");
    const pageContainer = read('src/components/common/PageContainer.tsx');
    expect(shell).toContain('WIDTH_CLASS');
    expect(pageContainer).toContain('max-w-page-narrow');
    expect(pageContainer).toContain('max-w-page-wide');
  });

  it('shares auth shell between auth page and session boot', () => {
    const authLayout = read('src/components/layouts/AuthLayout.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(authLayout).toContain('SanskritRainBackground');
    expect(authPage).not.toContain('SanskritRainBackground');
    expect(routeGuard).toContain('AuthLayout');
    expect(routeGuard).toContain('variant="boot"');
  });

  it('avoids nested main landmarks in the app root', () => {
    const app = read('src/App.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(app).not.toContain('<main');
    expect(appLayout).toContain('<main');
  });

  it('aligns workspace sidebar breakpoint to tablet', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    expect(appLayout).toContain('tablet:block');
    expect(appLayout).toContain('tablet:hidden');
  });
});
