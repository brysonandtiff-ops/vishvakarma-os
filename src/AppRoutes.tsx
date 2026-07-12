import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
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

type PageModule = { default: ComponentType };
type PageLoader = () => Promise<PageModule>;
type StyleLoader = () => Promise<unknown>;

function lazyStyledPage(
  loadPage: PageLoader,
  loadStyles: StyleLoader,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    await loadStyles();
    return loadPage();
  });
}

const loadMarketingStyles = () => import('@/styles/entries/marketing');
const loadAuthStyles = () => import('@/styles/entries/auth');
const loadWorkspaceStyles = () => import('@/styles/entries/workspace');
const loadEditorStyles = () =>
  Promise.all([
    import('@/styles/entries/workspace'),
    import('@/styles/entries/editor'),
  ]);

// Route-owned CSS is imported with each lazy page family. Landing and auth users
// no longer download editor, 3D, or governance styles during initial startup.
const EditorPage = lazyStyledPage(() => import('@/pages/EditorPage'), loadEditorStyles);
const LiteEditorPage = lazyStyledPage(() => import('@/pages/LiteEditorPage'), loadEditorStyles);
const ProjectsPage = lazyStyledPage(() => import('@/pages/ProjectsPage'), loadWorkspaceStyles);
const ProfilePage = lazyStyledPage(() => import('@/pages/ProfilePage'), loadWorkspaceStyles);
const LandingPage = lazyStyledPage(() => import('@/pages/LandingPage'), loadMarketingStyles);
const FeaturesPage = lazyStyledPage(() => import('@/pages/FeaturesPage'), loadMarketingStyles);
const PricingPage = lazyStyledPage(() => import('@/pages/PricingPage'), loadMarketingStyles);
const ResetPasswordPage = lazyStyledPage(() => import('@/pages/ResetPasswordPage'), loadAuthStyles);
const SpecCenterPage = lazyStyledPage(() => import('@/pages/SpecCenterPage'), loadWorkspaceStyles);
const RegistryPage = lazyStyledPage(() => import('@/pages/RegistryPage'), loadWorkspaceStyles);
const ChangeRequestsPage = lazyStyledPage(() => import('@/pages/ChangeRequestsPage'), loadWorkspaceStyles);
const ReleasesPage = lazyStyledPage(() => import('@/pages/ReleasesPage'), loadWorkspaceStyles);
const AuditLogPage = lazyStyledPage(() => import('@/pages/AuditLogPage'), loadWorkspaceStyles);
const WorldRecordsPage = lazyStyledPage(() => import('@/pages/WorldRecordsPage'), loadWorkspaceStyles);
const OptimizationPage = lazyStyledPage(() => import('@/pages/OptimizationPage'), loadWorkspaceStyles);
const ThreeDRoomPage = lazyStyledPage(() => import('@/pages/ThreeDRoomPage'), loadEditorStyles);
const AuthPage = lazyStyledPage(() => import('@/pages/AuthPage'), loadAuthStyles);
const NotFoundPage = lazyStyledPage(() => import('@/pages/NotFound'), loadMarketingStyles);
const CastViewerPage = lazyStyledPage(() => import('@/pages/CastViewerPage'), loadEditorStyles);

function withSuspense(
  element: React.ReactNode,
  variant: React.ComponentProps<typeof RouteLoadingFallback>['variant'],
) {
  return <Suspense fallback={<RouteLoadingFallback variant={variant} />}>{element}</Suspense>;
}

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
