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

// All pages are lazy-loaded — EditorPage was previously a static import (the only one),
// pulling the entire editor surface (canvas, 3D viewport, tool rail, dialogs) into the
// initial bundle even for users on /auth or /. Now deferred like every other route.
const EditorPage = lazy(() => import('@/pages/EditorPage'));
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
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const CastViewerPage = lazy(() => import('@/pages/CastViewerPage'));

function withSuspense(element: React.ReactNode, variant: React.ComponentProps<typeof RouteLoadingFallback>['variant']) {
  return <Suspense fallback={<RouteLoadingFallback variant={variant} />}>{element}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={withSuspense(<LandingPage />, 'marketing')} />
        <Route path="/features" element={withSuspense(<FeaturesPage />, 'marketing')} />
        {PRICING_PAGE_ENABLED && (
          <Route path="/pricing" element={withSuspense(<PricingPage />, 'marketing')} />
        )}
        <Route path="/404" element={withSuspense(<NotFoundPage />, 'marketing')} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth" element={withSuspense(<AuthPage />, 'auth')} />
        <Route path="/reset-password" element={withSuspense(<ResetPasswordPage />, 'auth')} />
      </Route>

      <Route path="/cast/:token" element={withSuspense(<CastViewerPage />, 'editor')} />

      <Route element={<AppLayoutOutlet immersive />}>
        <Route path="/editor" element={withSuspense(<EditorPage />, 'editor')} />
      </Route>

      <Route element={<AppLayoutOutlet />}>
        <Route element={<WorkspaceDocumentLayout />}>
          <Route path="/projects" element={withSuspense(<ProjectsPage />, 'workspace')} />
        </Route>
        <Route element={<WorkspaceDocumentNarrowLayout />}>
          <Route path="/profile" element={withSuspense(<ProfilePage />, 'workspace')} />
        </Route>
        <Route element={<WorkspaceGovernanceLayout />}>
          <Route path="/optimization" element={withSuspense(<OptimizationPage />, 'governance')} />
          <Route path="/spec-center" element={withSuspense(<SpecCenterPage />, 'governance')} />
          <Route path="/registry" element={withSuspense(<RegistryPage />, 'governance')} />
          <Route path="/change-requests" element={withSuspense(<ChangeRequestsPage />, 'governance')} />
          <Route path="/releases" element={withSuspense(<ReleasesPage />, 'governance')} />
          <Route path="/world-records" element={withSuspense(<WorldRecordsPage />, 'governance')} />
          <Route path="/audit" element={withSuspense(<AuditLogPage />, 'governance')} />
        </Route>
      </Route>

      <Route path="*" element={<AuthAwareNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
