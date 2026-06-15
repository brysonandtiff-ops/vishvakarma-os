import { lazy, Suspense, type ReactNode } from 'react';
import ProjectsPage from './pages/ProjectsPage';
import ProfilePage from './pages/ProfilePage';
import EditorPage from './pages/EditorPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { PRICING_PAGE_ENABLED } from './config/marketingFeatures';
import SpecCenterPage from './pages/SpecCenterPage';
import RegistryPage from './pages/RegistryPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import ReleasesPage from './pages/ReleasesPage';
import AuditLogPage from './pages/AuditLogPage';
import WorldRecordsPage from './pages/WorldRecordsPage';
import OptimizationPage from './pages/OptimizationPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFound';

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
    element: <LandingPage />,
    visible: false,
    access: 'public',
  },
  {
    name: 'Features',
    path: '/features',
    element: <FeaturesPage />,
    visible: false,
    access: 'public',
  },
  ...(PRICING_PAGE_ENABLED
    ? [
        {
          name: 'Pricing',
          path: '/pricing',
          element: <PricingPage />,
          visible: false,
          access: 'public' as const,
        },
      ]
    : []),
  {
    name: 'Account Access',
    path: '/auth',
    element: <AuthPage />,
    visible: false,
    access: 'public',
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
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
    element: <NotFoundPage />,
    visible: false,
    access: 'public',
  },
  {
    name: 'Blueprint Editor',
    path: '/editor',
    element: <EditorPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Projects',
    path: '/projects',
    element: <ProjectsPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Design Optimization',
    path: '/optimization',
    element: <OptimizationPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Spec Center',
    path: '/spec-center',
    element: <SpecCenterPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Registry Center',
    path: '/registry',
    element: <RegistryPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Change Requests',
    path: '/change-requests',
    element: <ChangeRequestsPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Release Center',
    path: '/releases',
    element: <ReleasesPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'World Records',
    path: '/world-records',
    element: <WorldRecordsPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Audit Log',
    path: '/audit',
    element: <AuditLogPage />,
    visible: true,
    access: 'private',
  },
];

export default routes;
