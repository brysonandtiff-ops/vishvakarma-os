import { OPERATOR_CHROME_ENABLED } from '@/config/operatorChrome';
import AnalyticsConsentBanner from '@/components/common/AnalyticsConsentBanner';
import VisualThemeController from '@/components/common/VisualThemeController';
import { MantraPlayerWidget } from '@/components/common/MantraPlayerWidget';
import GuidedDemoSessionController from '@/demo-session/GuidedDemoSessionController';
import EmptyCanvasGuidedStart from '@/empty-canvas/EmptyCanvasGuidedStart';
import QaEvidencePanel from '@/qa-evidence/QaEvidencePanel';
import IpadTouchAuditHud from '@/touch-audit/IpadTouchAuditHud';
import VoiceGuidedTour from '@/voice-tour/VoiceGuidedTour';

/** Global overlays mounted outside the route tree — user-facing vs operator-only. */
export default function AppShellOverlays() {
  return (
    <>
      {OPERATOR_CHROME_ENABLED && <GuidedDemoSessionController />}
      <EmptyCanvasGuidedStart />
      {OPERATOR_CHROME_ENABLED && <VisualThemeController />}
      <AnalyticsConsentBanner />
      <MantraPlayerWidget />
      {OPERATOR_CHROME_ENABLED && <VoiceGuidedTour />}
      {OPERATOR_CHROME_ENABLED && <QaEvidencePanel />}
      {OPERATOR_CHROME_ENABLED && <IpadTouchAuditHud />}
    </>
  );
}
