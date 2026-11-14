import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAppRouteManifest } from '../../src/config/routeManifest';
import { isApiHandlerFile, parseRouteInventory } from './inventory-parsers.mjs';

const routeElements = `
  const ROUTE_ELEMENTS = {
    '/': lazyRoute(<HomePage />),
    '/projects': lazyRoute(<ProjectsPage />),
    '/pricing': lazyRoute(<PricingPage />),
  };
`;
const manifestSource = `
  const CORE_ROUTE_MANIFEST = [
    { path: '/', name: 'Home', access: 'public', layout: 'marketing' },
    { access: 'private', name: 'Projects', path: '/projects', layout: 'workspace' },
  ];
  const PRICING_ROUTE = { path: '/pricing', name: 'Pricing', access: 'public' };
  function getAppRouteManifest() {
    const manifest = [...CORE_ROUTE_MANIFEST];
    if (PRICING_PAGE_ENABLED) manifest.splice(1, 0, PRICING_ROUTE);
    return manifest;
  }
`;

describe('handoff route and API inventories', () => {
  it('joins manifest metadata to lazy route elements, including conditional pricing', () => {
    expect(parseRouteInventory(routeElements, manifestSource)).toEqual({
      routes: [
        { path: '/', name: 'Home', access: 'public', component: 'HomePage' },
        { path: '/projects', name: 'Projects', access: 'private', component: 'ProjectsPage' },
        { path: '/pricing', name: 'Pricing', access: 'public', component: 'PricingPage' },
      ],
      pricingFlag: true,
    });
  });

  it('fails instead of silently omitting a route with no renderable element', () => {
    expect(() => parseRouteInventory('const ROUTE_ELEMENTS = {};', manifestSource)).toThrow(/element/i);
  });

  it('matches actual application route metadata and all 21 supported route paths', () => {
    const { routes, pricingFlag } = parseRouteInventory(
      readFileSync('src/routes.tsx', 'utf8'),
      readFileSync('src/config/routeManifest.ts', 'utf8'),
    );
    const runtimeRoutes = getAppRouteManifest();
    expect(routes).toHaveLength(21);
    expect(new Set(routes.map((route) => route.path))).toEqual(
      new Set([...runtimeRoutes.map((route) => route.path), '/pricing']),
    );
    for (const entry of runtimeRoutes) {
      expect(routes).toContainEqual(expect.objectContaining({
        path: entry.path, name: entry.name, access: entry.access,
      }));
    }
    expect(pricingFlag).toBe(true);
  });

  it('includes endpoint implementations and excludes tests, declarations and private libraries', () => {
    const files = [
      'api/health.ts', 'api/stripe/webhook.ts', 'api/cast/sessions.ts',
      'api/endpointHandlers.test.ts', 'api/stripe/webhook.spec.ts',
      'api/request.d.ts', 'api/_lib/httpSecurity.ts', 'api/_internal.ts',
    ];
    expect(files.filter(isApiHandlerFile)).toEqual([
      'api/health.ts', 'api/stripe/webhook.ts', 'api/cast/sessions.ts',
    ]);
  });
});
