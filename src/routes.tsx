import { lazy, Suspense, type ReactNode } from 'react';
import { getAppRouteManifest, type RouteAccess } from '@/config/routeManifest';

const EditorPage = lazy(() => import('./pages/EditorPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SpecCenterPage = lazy(() => import('./pages/SpecCenterPage'));
const RegistryPage = lazy(() => import('./pages/RegistryPage'));
const ChangeRequestsPage = lazy(() => import('./pages/ChangeRequestsPage'));
const ReleasesPage = lazy(() => import('./pages/ReleasesPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const WorldRecordsPage = lazy(() => import('./pages/WorldRecordsPage'));
const OptimizationPage = lazy(() => import('./pages/OptimizationPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const CastViewerPage = lazy(() => import('./pages/CastViewerPage'));

function lazyRoute(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

const ROUTE_ELEMENTS: Record<string, ReactNode> = {
  '/': lazyRoute(<LandingPage />),
  '/features': lazyRoute(<FeaturesPage />),
  '/pricing': lazyRoute(<PricingPage />),
  '/auth': lazyRoute(<AuthPage />),
  '/reset-password': lazyRoute(<ResetPasswordPage />),
  '/cast/:token': lazyRoute(<CastViewerPage />),
  '/404': lazyRoute(<NotFoundPage />),
  '/editor': lazyRoute(<EditorPage />),
  '/projects': lazyRoute(<ProjectsPage />),
  '/optimization': lazyRoute(<OptimizationPage />),
  '/profile': lazyRoute(<ProfilePage />),
  '/spec-center': lazyRoute(<SpecCenterPage />),
  '/registry': lazyRoute(<RegistryPage />),
  '/change-requests': lazyRoute(<ChangeRequestsPage />),
  '/releases': lazyRoute(<ReleasesPage />),
  '/world-records': lazyRoute(<WorldRecordsPage />),
  '/audit': lazyRoute(<AuditLogPage />),
};

export type { RouteAccess };

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  access: RouteAccess;
}

const routes: RouteConfig[] = getAppRouteManifest().map((entry) => {
  const element = ROUTE_ELEMENTS[entry.path];
  if (!element) {
    throw new Error(`Missing lazy route element for manifest path: ${entry.path}`);
  }
  return {
    name: entry.name,
    path: entry.path,
    element,
    visible: entry.visible,
    access: entry.access,
  };
});

export default routes;
