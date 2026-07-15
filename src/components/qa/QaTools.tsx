import { DeviceValidationPanel } from '@/components/qa/DeviceValidationPanel';
import QaEvidencePanel from '@/qa-evidence/QaEvidencePanel';
import IpadTouchAuditHud from '@/touch-audit/IpadTouchAuditHud';
import '@/styles/vish-device-validation.css';
import '@/styles/vish-qa-evidence.css';
import '@/styles/vish-touch-audit-hud.css';

export default function QaTools() {
  return (
    <>
      <DeviceValidationPanel />
      <QaEvidencePanel />
      <IpadTouchAuditHud />
    </>
  );
}
