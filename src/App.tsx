import React, { lazy, Suspense } from 'react';
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

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <MfaChallengeGate>
          <StudioAudioProvider>
            <TutorialProvider>
              <RouteGuard>
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
