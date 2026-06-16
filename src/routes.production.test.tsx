import { describe, expect, it } from 'vitest';
import { isProtectedRoute } from './components/common/RouteGuard';
import { PRICING_PAGE_ENABLED } from './config/marketingFeatures';
import routes from './routes';

const expectedRoutePaths = [
  '/',
  '/features',
  ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []),
  '/auth',
  '/reset-password',
  '/cast/:token',
  '/404',
  '/editor',
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

const expectedPublicRoutePaths = [
  '/',
  '/features',
  ...(PRICING_PAGE_ENABLED ? ['/pricing' as const] : []),
  '/auth',
  '/reset-password',
  '/cast/:token',
  '/404',
];

const expectedPrivateRoutePaths = [
  '/editor',
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

describe('production route manifest', () => {
  it('exposes the expected production routes exactly once', () => {
    const routePaths = routes.map((route) => route.path);
    const uniqueRoutePaths = new Set(routePaths);

    expect(routePaths).toEqual(expectedRoutePaths);
    expect(uniqueRoutePaths.size).toBe(routePaths.length);
  });

  it('keeps every route named, access-scoped, and renderable', () => {
    for (const route of routes) {
      expect(route.name.trim().length).toBeGreaterThan(0);
      expect(['public', 'private']).toContain(route.access);
      expect(route.element).toBeTruthy();
    }
  });

  it('keeps marketing and auth routes public', () => {
    const publicRoutes = routes.filter((route) => route.access === 'public').map((route) => route.path);
    const privateRoutes = routes.filter((route) => route.access === 'private').map((route) => route.path);

    expect(publicRoutes).toEqual(expectedPublicRoutePaths);
    expect(privateRoutes).toEqual(expectedPrivateRoutePaths);
  });

  it('keeps the editor as the first private route for authenticated entry', () => {
    const firstPrivateRoute = routes.find((route) => route.access === 'private');
    expect(firstPrivateRoute?.path).toBe('/editor');
    expect(firstPrivateRoute?.name).toBe('Blueprint Editor');
  });
});

describe('route access guard', () => {
  it('treats unknown paths as public so the wildcard 404 renders without auth redirect', () => {
    expect(isProtectedRoute('/404-test')).toBe(false);
    expect(isProtectedRoute('/not-real-page')).toBe(false);
    expect(isProtectedRoute('/random/deep/path')).toBe(false);
  });

  it('keeps manifest private routes auth-gated', () => {
    for (const path of expectedPrivateRoutePaths) {
      expect(isProtectedRoute(path)).toBe(true);
    }
  });

  it('keeps marketing and auth routes public', () => {
    for (const path of expectedPublicRoutePaths) {
      expect(isProtectedRoute(path)).toBe(false);
    }
  });
});
