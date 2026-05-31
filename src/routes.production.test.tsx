import { describe, expect, it } from 'vitest';
import routes from './routes';

const expectedRoutePaths = [
  '/',
  '/features',
  '/pricing',
  '/auth',
  '/reset-password',
  '/404',
  '/editor',
  '/projects',
  '/profile',
  '/spec-center',
  '/registry',
  '/change-requests',
  '/releases',
  '/world-records',
  '/audit',
];

const expectedPublicRoutePaths = ['/', '/features', '/pricing', '/auth', '/reset-password', '/404'];

const expectedPrivateRoutePaths = [
  '/editor',
  '/projects',
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
