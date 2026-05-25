import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from '@/routes';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Vishvakarma.OS functional wiring guard', () => {
  it('keeps route manifest complete and access-scoped', () => {
    const expectedRoutes = ['/auth', '/', '/spec-center', '/registry', '/change-requests', '/releases', '/audit'];
    const actualRoutes = routes.map((route) => route.path);

    expect(actualRoutes).toEqual(expectedRoutes);
    expect(new Set(actualRoutes).size).toBe(actualRoutes.length);
    expect(routes.find((route) => route.path === '/auth')?.access).toBe('public');

    const privateRoutes = routes.filter((route) => route.path !== '/auth');
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
    expect(app).toContain('<Route path="*" element={<Navigate to="/" replace />} />');
  });

  it('keeps protected routing enforced through RouteGuard', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(routeGuard).toContain("const PUBLIC_ROUTES = ['/auth']");
    expect(routeGuard).toContain("navigate('/auth'");
    expect(routeGuard).toContain("state: { from: location.pathname }");
    expect(routeGuard).toContain('if (gated && !user && !publicRoute)');
    expect(routeGuard).toContain('return null');
  });

  it('keeps loading, auth, and app shell surfaces on the official brand asset', () => {
    const routeGuard = read('src/components/common/RouteGuard.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(routeGuard).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(routeGuard).toContain('Checking secure session');
    expect(authPage).toContain('Request secure access');
    expect(appLayout).toContain('VISHVAKARMA.OS');
  });
});
