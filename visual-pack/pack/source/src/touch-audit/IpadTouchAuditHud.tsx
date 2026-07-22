import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardCopy, MousePointer2, RefreshCw, Tablet, X } from 'lucide-react';
import { toast } from 'sonner';

export const OPEN_IPAD_TOUCH_AUDIT_EVENT = 'vish:open-ipad-touch-audit';

type AuditSeverity = 'fail' | 'warn' | 'info';
type AuditKind = 'small-target' | 'offscreen' | 'blocked-tap' | 'overflow-trap';

type AuditRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type AuditIssue = {
  id: string;
  severity: AuditSeverity;
  kind: AuditKind;
  label: string;
  detail: string;
  selector: string;
  rect: AuditRect;
};

const MIN_TOUCH_TARGET = 44;
const MAX_ISSUES = 36;

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const OVERFLOW_SELECTOR = [
  '.overflow-hidden',
  '.overflow-x-hidden',
  '.overflow-y-hidden',
  '[class*="overflow-hidden"]',
  '[class*="overflow-clip"]',
].join(',');

export function openIpadTouchAuditHud() {
  window.dispatchEvent(new Event(OPEN_IPAD_TOUCH_AUDIT_EVENT));
}

function isVisibleElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function labelForElement(element: HTMLElement): string {
  const aria = element.getAttribute('aria-label');
  if (aria) return aria;
  const testId = element.getAttribute('data-testid');
  if (testId) return `[${testId}]`;
  const title = element.getAttribute('title');
  if (title) return title;
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 58);
  return element.tagName.toLowerCase();
}

function selectorForElement(element: HTMLElement): string {
  const testId = element.getAttribute('data-testid');
  if (testId) return `[data-testid="${testId}"]`;
  if (element.id) return `#${element.id}`;
  const className = Array.from(element.classList).slice(0, 2).join('.');
  return className ? `${element.tagName.toLowerCase()}.${className}` : element.tagName.toLowerCase();
}

function rectSummary(rect: DOMRect): AuditRect {
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function isInAuditUi(element: HTMLElement): boolean {
  return Boolean(element.closest('.vish-touch-audit-hud'));
}

function pushIssue(issues: AuditIssue[], issue: Omit<AuditIssue, 'id'>) {
  if (issues.length >= MAX_ISSUES) return;
  issues.push({ ...issue, id: `${issue.kind}-${issues.length + 1}` });
}

function scanTouchIssues(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR));

  for (const element of candidates) {
    if (isInAuditUi(element) || !isVisibleElement(element)) continue;
    const rect = element.getBoundingClientRect();
    const label = labelForElement(element);
    const selector = selectorForElement(element);
    const rectData = rectSummary(rect);

    if (rect.width < MIN_TOUCH_TARGET || rect.height < MIN_TOUCH_TARGET) {
      pushIssue(issues, {
        severity: 'fail',
        kind: 'small-target',
        label,
        selector,
        rect: rectData,
        detail: `Tap target is ${Math.round(rect.width)}x${Math.round(rect.height)}px. Target should be at least ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px.`,
      });
    }

    if (rect.left < 0 || rect.top < 0 || rect.right > viewportWidth || rect.bottom > viewportHeight) {
      pushIssue(issues, {
        severity: 'warn',
        kind: 'offscreen',
        label,
        selector,
        rect: rectData,
        detail: 'Interactive control is partly outside the visible viewport.',
      });
    }

    const centerX = Math.min(Math.max(rect.left + rect.width / 2, 1), viewportWidth - 1);
    const centerY = Math.min(Math.max(rect.top + rect.height / 2, 1), viewportHeight - 1);
    const hit = document.elementFromPoint(centerX, centerY);
    if (hit && hit !== element && !element.contains(hit) && !hit.contains(element)) {
      pushIssue(issues, {
        severity: 'warn',
        kind: 'blocked-tap',
        label,
        selector,
        rect: rectData,
        detail: `Center tap appears blocked by ${selectorForElement(hit as HTMLElement)}.`,
      });
    }
  }

  const overflowCandidates = Array.from(document.querySelectorAll<HTMLElement>(OVERFLOW_SELECTOR));
  for (const element of overflowCandidates) {
    if (isInAuditUi(element) || !isVisibleElement(element)) continue;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const horizontalTrap = element.scrollWidth > element.clientWidth + 8 && ['hidden', 'clip'].includes(style.overflowX);
    const verticalTrap = element.scrollHeight > element.clientHeight + 8 && ['hidden', 'clip'].includes(style.overflowY);
    if (!horizontalTrap && !verticalTrap) continue;

    pushIssue(issues, {
      severity: 'warn',
      kind: 'overflow-trap',
      label: labelForElement(element),
      selector: selectorForElement(element),
      rect: rectSummary(rect),
      detail: horizontalTrap
        ? 'Content is wider than the container but horizontal overflow is hidden or clipped.'
        : 'Content is taller than the container but vertical overflow is hidden or clipped.',
    });
  }

  return issues;
}

function buildReport(issues: AuditIssue[]): string {
  const failCount = issues.filter((issue) => issue.severity === 'fail').length;
  const warnCount = issues.filter((issue) => issue.severity === 'warn').length;
  const lines = [
    '# Vishvakarma.OS iPad Touch Audit',
    '',
    `Scanned: ${new Date().toISOString()}`,
    `Issues: ${issues.length} (${failCount} fail, ${warnCount} warning)`,
    '',
  ];

  if (issues.length === 0) {
    lines.push('No touch target, blocking, or overflow issues found in the current viewport.');
    return lines.join('\n');
  }

  for (const issue of issues) {
    lines.push(`## ${issue.severity.toUpperCase()} — ${issue.label}`);
    lines.push(`Kind: ${issue.kind}`);
    lines.push(`Selector: ${issue.selector}`);
    lines.push(`Rect: ${issue.rect.width}x${issue.rect.height}px at ${issue.rect.left},${issue.rect.top}`);
    lines.push(issue.detail);
    lines.push('');
  }

  return lines.join('\n');
}

export default function IpadTouchAuditHud() {
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);

  const failCount = useMemo(() => issues.filter((issue) => issue.severity === 'fail').length, [issues]);
  const warnCount = useMemo(() => issues.filter((issue) => issue.severity === 'warn').length, [issues]);

  const runScan = useCallback(() => {
    window.requestAnimationFrame(() => {
      const result = scanTouchIssues();
      setIssues(result);
      setLastScanAt(new Date().toLocaleTimeString());
      if (result.length === 0) {
        toast.success('Touch audit clear', { description: 'No iPad touch issues found in this viewport.' });
      } else {
        toast.message('Touch audit complete', { description: `${result.length} issue(s) found in this viewport.` });
      }
    });
  }, []);

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildReport(issues));
      toast.success('Touch audit report copied');
    } catch {
      toast.message('Touch audit report ready', { description: 'Clipboard unavailable. Re-run on desktop if needed.' });
    }
  }, [issues]);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      window.setTimeout(runScan, 80);
    };
    window.addEventListener(OPEN_IPAD_TOUCH_AUDIT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_IPAD_TOUCH_AUDIT_EVENT, onOpen);
  }, [runScan]);

  if (!open) return null;

  return (
    <aside className="vish-touch-audit-hud" aria-label="iPad touch audit HUD">
      <div className="vish-touch-audit-hud__overlay" aria-hidden>
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`vish-touch-audit-highlight ${issue.severity}`}
            style={{
              left: issue.rect.left,
              top: issue.rect.top,
              width: Math.max(issue.rect.width, 12),
              height: Math.max(issue.rect.height, 12),
            }}
          />
        ))}
      </div>
      <div className="vish-touch-audit-hud__panel">
        <header>
          <div>
            <p>Tester HUD</p>
            <h2>iPad Touch Audit</h2>
            <span>{lastScanAt ? `Last scan ${lastScanAt}` : 'Not scanned yet'}</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close iPad touch audit HUD">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="vish-touch-audit-hud__summary">
          <span>{failCount} fail</span>
          <span>{warnCount} warn</span>
          <span>{issues.length} total</span>
        </div>

        <div className="vish-touch-audit-hud__actions">
          <button type="button" onClick={runScan}>
            <RefreshCw className="h-3.5 w-3.5" />
            Scan viewport
          </button>
          <button type="button" onClick={copyReport}>
            <ClipboardCopy className="h-3.5 w-3.5" />
            Copy report
          </button>
        </div>

        <div className="vish-touch-audit-hud__list">
          {issues.length === 0 ? (
            <div className="vish-touch-audit-empty">
              <MousePointer2 className="h-4 w-4" />
              <span>No current viewport issues found.</span>
            </div>
          ) : (
            issues.map((issue) => (
              <article key={issue.id} className={`vish-touch-audit-issue ${issue.severity}`}>
                <div>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <strong>{issue.label}</strong>
                </div>
                <p>{issue.detail}</p>
                <code>{issue.selector}</code>
              </article>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
