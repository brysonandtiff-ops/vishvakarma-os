import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TutorialProvider } from '@/tutorial/TutorialProvider';
import { StudioAudioProvider } from '@/modules/studio-audio/StudioAudioProvider';
import { initMonitoring } from '@/lib/monitoring';
import AnalyticsConsentBanner from '@/components/common/AnalyticsConsentBanner';
import VisualThemeController from '@/components/common/VisualThemeController';
import { MantraPlayerWidget } from '@/components/common/MantraPlayerWidget';
import VoiceGuidedTour from '@/voice-tour/VoiceGuidedTour';
import GuidedDemoSessionController from '@/demo-session/GuidedDemoSessionController';
import QaEvidencePanel from '@/qa-evidence/QaEvidencePanel';
import { Analytics } from '@vercel/analytics/react';
import { AppRoutes } from '@/AppRoutes';

initMonitoring();

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <StudioAudioProvider>
        <TutorialProvider>
        <RouteGuard>
          <IntersectObserver />
          <div className="flex min-h-screen flex-col">
            <AppErrorBoundary title="Workspace failed to render">
              <AppRoutes />
            </AppErrorBoundary>
          </div>
          <GuidedDemoSessionController />
          <VisualThemeController />
          <AnalyticsConsentBanner />
          <MantraPlayerWidget />
          <VoiceGuidedTour />
          <QaEvidencePanel />
          <Analytics />
          <Toaster />
        </RouteGuard>
        </TutorialProvider>
        </StudioAudioProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
