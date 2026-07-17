import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { RouteGuard } from '@/components/common/RouteGuard';
import EditorPwaReloadBlocker from '@/components/common/EditorPwaReloadBlocker';
import PwaUpdateBanner from '@/components/common/PwaUpdateBanner';
import MfaChallengeGate from '@/components/auth/MfaChallengeGate';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TutorialProvider } from '@/tutorial/TutorialProvider';
import { StudioAudioProvider } from '@/modules/studio-audio/StudioAudioProvider';
import { initMonitoring } from '@/lib/monitoring';
import AnalyticsConsentBanner from '@/components/common/AnalyticsConsentBanner';
import ConsentAnalytics from '@/components/common/ConsentAnalytics';
import VisualThemeController from '@/components/common/VisualThemeController';
import { MantraPlayerWidget } from '@/components/common/MantraPlayerWidget';
import VoiceGuidedTour from '@/voice-tour/VoiceGuidedTour';
import GuidedDemoSessionController from '@/demo-session/GuidedDemoSessionController';
import EmptyCanvasGuidedStart from '@/empty-canvas/EmptyCanvasGuidedStart';
import { AppRoutes } from '@/AppRoutes';
import '@/styles/vish-overlay-safety.css';

const QaTools = __VISH_QA_TOOLS_ENABLED__
  ? lazy(() => import('@/components/qa/QaTools'))
  : null;

initMonitoring();

/**
 * Mirrors mounted overlay state onto body attributes.
 *
 * The CSS keeps :has() as a modern progressive enhancement, while these
 * attributes provide equivalent exclusivity on the older browsers declared in
 * browserslist (including Safari/iOS 14, Firefox 88, and Chrome 90).
 */
function OverlayExclusivityController() {
  useEffect(() => {
    const body = document.body;

    const syncOverlayState = () => {
      const blockingOverlayOpen = Boolean(
        document.querySelector("[data-testid='first-run-welcome'], [aria-modal='true']"),
      );
      const analyticsConsentVisible = Boolean(
        document.querySelector('.vish-analytics-consent'),
      );

      body.toggleAttribute('data-vish-blocking-overlay', blockingOverlayOpen);
      body.toggleAttribute('data-vish-analytics-visible', analyticsConsentVisible);
    };

    syncOverlayState();

    const observer = new MutationObserver(syncOverlayState);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['aria-modal', 'class', 'data-testid'],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      body.removeAttribute('data-vish-blocking-overlay');
      body.removeAttribute('data-vish-analytics-visible');
    };
  }, []);

  return null;
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <MfaChallengeGate>
          <StudioAudioProvider>
            <TutorialProvider>
              <RouteGuard>
                <OverlayExclusivityController />
                <EditorPwaReloadBlocker />
                <IntersectObserver />
                <div className="flex min-h-[100dvh] flex-col overflow-hidden">
                  <AppErrorBoundary title="Workspace failed to render">
                    <AppRoutes />
                  </AppErrorBoundary>
                </div>
                <GuidedDemoSessionController />
                <EmptyCanvasGuidedStart />
                <VisualThemeController />
                <AnalyticsConsentBanner />
                <ConsentAnalytics />
                <MantraPlayerWidget />
                <VoiceGuidedTour />
                <PwaUpdateBanner />
                {QaTools ? (
                  <Suspense fallback={null}>
                    <QaTools />
                  </Suspense>
                ) : null}
                <Toaster />
              </RouteGuard>
            </TutorialProvider>
          </StudioAudioProvider>
        </MfaChallengeGate>
      </AuthProvider>
    </Router>
  );
};

export default App;
