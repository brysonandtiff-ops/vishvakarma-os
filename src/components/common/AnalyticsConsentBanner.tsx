import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { setAnalyticsConsent } from '@/lib/analytics';

export default function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(() => localStorage.getItem('vishvakarma-analytics-consent') === null);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
      <p className="text-xs text-foreground/80">
        Vishvakarma.OS uses optional privacy-respecting analytics to improve the editor. No tracking until you opt in.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { setAnalyticsConsent(false); setVisible(false); }}>
          Decline
        </Button>
        <Button size="sm" onClick={() => { setAnalyticsConsent(true); setVisible(false); }}>
          Allow
        </Button>
      </div>
    </div>
  );
}
