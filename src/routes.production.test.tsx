import { describe, expect, it } from 'vitest';
import routes from './routes';

const expectedProductionRoutes = [
  '/',
  '/spec-center',
  '/registry',
  '/change-requests',
  '/releases',
  '/audit',
];

describe('production route manifest', () => {
  it('exposes the expected production routes exactly once', () => {
    const routePaths = routes.map((route) => route.path);
    const uniqueRoutePaths = new Set(routePaths);

    expect(routePaths).toEqual(expectedProductionRoutes);
    expect(uniqueRoutePaths.size).toBe(routePaths.length);
  });

  it('keeps every production route named, visible, and renderable', () => {
    for (const route of routes) {
      expect(route.name.trim().length).toBeGreaterThan(0);
      expect(route.visible).toBe(true);
      expect(route.element).toBeTruthy();
    }
  });

  it('keeps the editor as the root route for direct production entry', () => {
    expect(routes[0]?.path).toBe('/');
    expect(routes[0]?.name).toBe('Blueprint Editor');
  });
});
