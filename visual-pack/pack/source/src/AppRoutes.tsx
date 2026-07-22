import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { AppLayoutOutlet } from '@/components/layouts/AppLayoutOutlet';
import {
  WorkspaceDocumentLayout,
  WorkspaceDocumentNarrowLayout,
} from '@/components/layouts/WorkspaceDocumentLayout';
import { WorkspaceGovernanceLayout } from '@/components/layouts/WorkspaceGovernanceLayout';
import { RouteLoadingFallback } from '@/components/layouts/RouteLoadingFallback';
import AuthAwareNotFound from '@/pages/AuthAwareNotFound';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

// All pages are lazy-loaded — EditorPage was previously a static import (the only one),
// pulling the entire editor surface (canvas, 3D viewport, tool rail, dialogs) into the
// initial bundle even for users on /auth or /. Now deferred like every other route.
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const LiteEditorPage = lazy(() => import('@/pages/LiteEditorPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const SpecCenterPage = lazy(() => import('@/pages/SpecCenterPage'));
const RegistryPage = lazy(() => import('@/pages/RegistryPage'));
const ChangeRequestsPage = lazy(() => import('@/pages/ChangeRequestsPage'));
const ReleasesPage = lazy(() => import('@/pages/ReleasesPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const WorldRecordsPage = lazy(() => import('@/pages/WorldRecordsPage'));
const OptimizationPage = lazy(() => import('@/pages/OptimizationPage'));
const ThreeDRoomPage = lazy(() => import('@/pages/ThreeDRoomPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const CastViewerPage = lazy(() => import('@/pages/CastViewerPage'));

function withSuspense(element: React.ReactNode, variant: React.ComponentProps<typeof RouteLoadingFallback>['variant']) {
  return <Suspense fallback={<RouteLoadingFallback variant={variant} />}>{element}</Suspense>;
}

// All screen surfaces now get isolated boundaries so a crash in any route shows
// a contained recovery card instead of taking down the whole shell.
function withBoundary(
  element: React.ReactNode,
  title: string,
  variant: React.ComponentProps<typeof RouteLoadingFallback>['variant'],
) {
  return (
    <AppErrorBoundary title={title}>
      {withSuspense(element, variant)}
    </AppErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={withBoundary(<LandingPage />, 'Home screen', 'marketing')} />
        <Route path="/features" element={withBoundary(<FeaturesPage />, 'Features screen', 'marketing')} />
        {PRICING_PAGE_ENABLED && (
          <Route path="/pricing" element={withBoundary(<PricingPage />, 'Pricing screen', 'marketing')} />
        )}
        <Route path="/404" element={withBoundary(<NotFoundPage />, 'Not found screen', 'marketing')} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth" element={withBoundary(<AuthPage />, 'Sign-in screen', 'auth')} />
        <Route path="/reset-password" element={withBoundary(<ResetPasswordPage />, 'Reset password screen', 'auth')} />
      </Route>

      <Route path="/cast/:token" element={withBoundary(<CastViewerPage />, 'Cast viewer', 'editor')} />

      <Route element={<AppLayoutOutlet immersive />}>
        <Route path="/editor" element={withBoundary(<EditorPage />, 'Blueprint Editor', 'editor')} />
        <Route path="/editor-lite" element={withBoundary(<LiteEditorPage />, 'Lite 2D/3D Editor', 'editor')} />
      </Route>

      <Route path="/3d-room" element={withBoundary(<ThreeDRoomPage />, '3D Room', 'editor')} />

      <Route element={<AppLayoutOutlet />}>
        <Route element={<WorkspaceDocumentLayout />}>
          <Route path="/projects" element={withBoundary(<ProjectsPage />, 'Projects Library', 'workspace')} />
        </Route>
        <Route element={<WorkspaceDocumentNarrowLayout />}>
          <Route path="/profile" element={withBoundary(<ProfilePage />, 'Profile screen', 'workspace')} />
        </Route>
        <Route element={<WorkspaceGovernanceLayout />}>
          <Route path="/optimization" element={withBoundary(<OptimizationPage />, 'Optimization Engine', 'governance')} />
          <Route path="/spec-center" element={withBoundary(<SpecCenterPage />, 'Spec Center', 'governance')} />
          <Route path="/registry" element={withBoundary(<RegistryPage />, 'Registry', 'governance')} />
          <Route path="/change-requests" element={withBoundary(<ChangeRequestsPage />, 'Change Requests', 'governance')} />
          <Route path="/releases" element={withBoundary(<ReleasesPage />, 'Releases', 'governance')} />
          <Route path="/world-records" element={withBoundary(<WorldRecordsPage />, 'World Records', 'governance')} />
          <Route path="/audit" element={withBoundary(<AuditLogPage />, 'Audit Log', 'governance')} />
        </Route>
      </Route>

      <Route path="*" element={<AuthAwareNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
