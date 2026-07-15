import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
} from '@/lib/analytics';

const VercelAnalytics = lazy(() =>
  import('@vercel/analytics/react').then(({ Analytics }) => ({ default: Analytics })),
);

export default function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(hasAnalyticsConsent);

  useEffect(() => {
    const syncConsent = () => setEnabled(hasAnalyticsConsent());
    const handleConsent = (event: Event) => {
      const granted = (event as CustomEvent<{ granted?: unknown }>).detail?.granted;
      setEnabled(granted === true);
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <VercelAnalytics />
    </Suspense>
  );
}
