import { lazy, Suspense, type ReactNode } from 'react';
import { PRICING_PAGE_ENABLED } from './config/marketingFeatures';

// EditorPage was the only statically-imported page in this file, pulling the entire
// editor surface (canvas, 3D viewport, tool rail, dialogs) into the initial bundle.
// Now lazy-loaded like every other route — resolves the static/dynamic import conflict
// that was preventing proper code splitting for this module.
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
const ThreeDRoomPage = lazy(() => import('./pages/ThreeDRoomPage'));

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

export type RouteAccess = 'public' | 'private';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  access: RouteAccess;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: lazyRoute(<LandingPage />),
    visible: false,
    access: 'public',
  },
  {
    name: 'Features',
    path: '/features',
    element: lazyRoute(<FeaturesPage />),
    visible: false,
    access: 'public',
  },
  ...(PRICING_PAGE_ENABLED
    ? [
        {
          name: 'Pricing',
          path: '/pricing',
          element: lazyRoute(<PricingPage />),
          visible: false,
          access: 'public' as const,
        },
      ]
    : []),
  {
    name: 'Account Access',
    path: '/auth',
    element: lazyRoute(<AuthPage />),
    visible: false,
    access: 'public',
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: lazyRoute(<ResetPasswordPage />),
    visible: false,
    access: 'public',
  },
  {
    name: 'Akasha Cast Viewer',
    path: '/cast/:token',
    element: lazyRoute(<CastViewerPage />),
    visible: false,
    access: 'public',
  },
  {
    name: 'Not Found',
    path: '/404',
    element: lazyRoute(<NotFoundPage />),
    visible: false,
    access: 'public',
  },
  {
    name: 'Blueprint Editor',
    path: '/editor',
    element: lazyRoute(<EditorPage />),
    visible: true,
    access: 'private',
  },
  {
    name: '3D Room',
    path: '/3d-room',
    element: lazyRoute(<ThreeDRoomPage />),
    visible: false,
    access: 'private',
  },
  {
    name: 'Projects',
    path: '/projects',
    element: lazyRoute(<ProjectsPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Design Optimization',
    path: '/optimization',
    element: lazyRoute(<OptimizationPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Profile',
    path: '/profile',
    element: lazyRoute(<ProfilePage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Spec Center',
    path: '/spec-center',
    element: lazyRoute(<SpecCenterPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Registry Center',
    path: '/registry',
    element: lazyRoute(<RegistryPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Change Requests',
    path: '/change-requests',
    element: lazyRoute(<ChangeRequestsPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Release Center',
    path: '/releases',
    element: lazyRoute(<ReleasesPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'World Records',
    path: '/world-records',
    element: lazyRoute(<WorldRecordsPage />),
    visible: true,
    access: 'private',
  },
  {
    name: 'Audit Log',
    path: '/audit',
    element: lazyRoute(<AuditLogPage />),
    visible: true,
    access: 'private',
  },
];

export default routes;
