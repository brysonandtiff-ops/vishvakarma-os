import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
} from '@/lib/analytics';

export default function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(() => getAnalyticsConsent() === null);

  if (!visible) return null;

  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setVisible(false);
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      aria-describedby="analytics-consent-description"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="space-y-1">
        <h2 id="analytics-consent-title" className="text-sm font-medium">
          Optional product analytics
        </h2>
        <p id="analytics-consent-description" className="text-xs text-foreground/80">
          Vishvakarma.OS uses privacy-respecting analytics to improve the editor. No analytics code loads until you opt in.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => choose(false)}>
          Decline
        </Button>
        <Button size="sm" onClick={() => choose(true)}>
          Allow
        </Button>
      </div>
    </aside>
  );
}
