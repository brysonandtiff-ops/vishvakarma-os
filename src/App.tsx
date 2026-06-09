import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/vish-editor-mantra.css';
import { initMonitoring } from '@/lib/monitoring';
import AnalyticsConsentBanner from '@/components/common/AnalyticsConsentBanner';
import { Analytics } from '@vercel/analytics/react';

initMonitoring();

import NotFound from './pages/NotFound';
import routes from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <IntersectObserver />
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <AppErrorBoundary title="Workspace failed to render">
                <Routes>
                  {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppErrorBoundary>
            </main>
          </div>
          <AnalyticsConsentBanner />
          <Toaster />
          <Analytics />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
