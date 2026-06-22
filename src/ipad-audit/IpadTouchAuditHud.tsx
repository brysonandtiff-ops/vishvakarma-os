import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, RefreshCw, Tablet, X } from 'lucide-react';
import { toast } from 'sonner';

export const OPEN_IPAD_TOUCH_AUDIT_EVENT = 'vish:open-ipad-touch-audit';

type Finding = {
  id: string;
  severity: 'warn' | 'fail';
  label: string;
  details: string;
};

const TARGETS = 'button,a[href],input,select,textarea,[role="button"],[role="tab"],[role="menuitem"],[tabindex]:not([tabindex="-1"])';

function labelFor(element: Element): string {
  const node = element as HTMLElement;
  return node.getAttribute('aria-label') || node.getAttribute('title') || node.getAttribute('data-testid') || node.textContent?.trim().replace(/\s+/g, ' ').slice(0, 44) || node.tagName.toLowerCase();
}

function visible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
}

function scan(): Finding[] {
  const findings: Finding[] = [];
  const width = window.innerWidth;
  const height = window.innerHeight;

  document.querySelectorAll<HTMLElement>(TARGETS).forEach((element, index) => {
    if (!visible(element)) return;
    const rect = element.getBoundingClientRect();
    const label = labelFor(element);

    if (rect.width < 44 || rect.height < 44) {
      findings.push({
        id: `small-${index}`,
        severity: rect.width < 36 || rect.height < 36 ? 'fail' : 'warn',
        label,
        details: `Tap target is ${Math.round(rect.width)} by ${Math.round(rect.height)}px. iPad target should be at least 44 by 44px.`,
      });
    }

    if (rect.left < -1 || rect.top < -1 || rect.right > width + 1 || rect.bottom > height + 1) {
      findings.push({ id: `offscreen-${index}`, severity: 'fail', label, details: 'Interactive element is partly outside the visible viewport.' });
    }

    const x = Math.min(Math.max(rect.left + rect.width / 2, 1), width - 1);
    const y = Math.min(Math.max(rect.top + rect.height / 2, 1), height - 1);
    const top = document.elementFromPoint(x, y);
    if (top && top !== element && !element.contains(top) && !top.contains(element)) {
      findings.push({ id: `blocked-${index}`, severity: 'warn', label, details: `Center tap may hit ${labelFor(top)} instead.` });
    }
  });

  document.querySelectorAll<HTMLElement>('body *').forEach((element, index) => {
    if (!visible(element)) return;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    if (element.scrollWidth > element.clientWidth + 8 && style.overflowX !== 'auto' && style.overflowX !== 'scroll' && rect.width > 120) {
      findings.push({ id: `overflow-${index}`, severity: 'warn', label: labelFor(element), details: 'Content is wider than its box and may clip or trap scrolling on iPad.' });
    }
  });

  return findings.slice(0, 40);
}

export function openIpadTouchAuditHud() {
  window.dispatchEvent(new Event(OPEN_IPAD_TOUCH_AUDIT_EVENT));
}

export default function IpadTouchAuditHud() {
  const [open, setOpen] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const summary = useMemo(() => ({
    total: findings.length,
    fail: findings.filter((item) => item.severity === 'fail').length,
    warn: findings.filter((item) => item.severity === 'warn').length,
  }), [findings]);

  const runScan = useCallback(() => {
    const next = scan();
    setFindings(next);
    toast.message('iPad touch audit complete', { description: next.length ? `${next.length} findings found` : 'No obvious touch issues found' });
  }, []);

  const copyReport = useCallback(async () => {
    const report = ['# iPad Touch Audit', `Findings: ${summary.total}`, ...findings.map((item, i) => `${i + 1}. [${item.severity}] ${item.label}: ${item.details}`)].join('\n');
    try {
      await navigator.clipboard.writeText(report);
      toast.success('Touch audit report copied');
    } catch {
      toast.message('Clipboard unavailable', { description: 'Screenshot this panel for proof.' });
    }
  }, [findings, summary.total]);

  useEffect(() => {
    const onOpen = () => { setOpen(true); window.setTimeout(runScan, 100); };
    window.addEventListener(OPEN_IPAD_TOUCH_AUDIT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_IPAD_TOUCH_AUDIT_EVENT, onOpen);
  }, [runScan]);

  if (!open) {
    return <button type="button" className="vish-ipad-audit-launch touch-target" onClick={() => { setOpen(true); runScan(); }}><Tablet className="h-4 w-4" />iPad Audit</button>;
  }

  return (
    <aside className="vish-ipad-audit-hud" aria-label="iPad Touch Audit HUD">
      <div className="vish-ipad-audit-hud__header">
        <div><p>Tester HUD</p><h2>iPad Touch Audit</h2><span>{summary.total} findings · {summary.fail} fail · {summary.warn} warn</span></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close iPad Touch Audit HUD"><X className="h-4 w-4" /></button>
      </div>
      <div className="vish-ipad-audit-hud__actions">
        <button type="button" onClick={runScan}><RefreshCw className="h-3.5 w-3.5" />Rescan</button>
        <button type="button" onClick={copyReport}><Copy className="h-3.5 w-3.5" />Copy report</button>
      </div>
      <div className="vish-ipad-audit-hud__list">
        {findings.length === 0 ? <p className="vish-ipad-audit-empty">No obvious iPad touch issues found. Still do a real finger test.</p> : findings.map((item) => (
          <article key={item.id} className={`vish-ipad-audit-card ${item.severity}`}><AlertTriangle className="h-4 w-4" /><div><strong>{item.label}</strong><span>{item.severity}</span><p>{item.details}</p></div></article>
        ))}
      </div>
    </aside>
  );
}
