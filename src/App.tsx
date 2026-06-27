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
import AppShellOverlays from '@/components/common/AppShellOverlays';
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
          <div className="flex min-h-[100dvh] flex-col overflow-hidden">
            <AppErrorBoundary title="Workspace failed to render">
              <AppRoutes />
            </AppErrorBoundary>
          </div>
          <AppShellOverlays />
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
