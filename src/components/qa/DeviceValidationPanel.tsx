import { useEffect, useMemo, useState } from "react";

type ValidationStatus = "pending" | "pass" | "fail";

type ValidationItem = {
  id: string;
  title: string;
  detail: string;
  status: ValidationStatus;
};

const STORAGE_KEY = "vish-device-validation-v1";

const baseChecks: ValidationItem[] = [
  {
    id: "ipad-10-landscape",
    title: "iPad 10 landscape",
    detail: "Open app on iPad 10 landscape and confirm top bars, tool rail, panels, canvas, and safe areas remain usable.",
    status: "pending",
  },
  {
    id: "ipad-10-portrait",
    title: "iPad 10 portrait",
    detail: "Rotate to portrait and confirm controls stay visible, scroll is controlled, and no Safari gray bounce appears.",
    status: "pending",
  },
  {
    id: "mobile-portrait",
    title: "Mobile portrait",
    detail: "Open on phone portrait and confirm auth, landing, project, editor, and governance screens are usable.",
    status: "pending",
  },
  {
    id: "desktop",
    title: "Desktop",
    detail: "Open desktop viewport and confirm the responsive hardening did not regress full-size workflow layout.",
    status: "pending",
  },
  {
    id: "auth",
    title: "Auth page",
    detail: "Confirm login/auth gate renders correctly with sacred theme, safe vertical sizing, and visible call-to-action controls.",
    status: "pending",
  },
  {
    id: "editor-open",
    title: "Editor open",
    detail: "Open the editor and confirm the canvas, top bar, tool rail, properties panel, and status areas are reachable.",
    status: "pending",
  },
  {
    id: "grid-demo-tour",
    title: "Grid, demo, voice tour",
    detail: "Run grid toggle, guided demo, and voice tour entry points without hidden or dead controls.",
    status: "pending",
  },
  {
    id: "safe-area-touch",
    title: "Safe area + 44px touch",
    detail: "Confirm critical controls avoid hardware bounds and remain comfortable 44x44px tap targets.",
    status: "pending",
  },
];

function readStored(): Record<string, ValidationStatus> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function buildMarkdownReport(items: ValidationItem[], autoScan: string[]) {
  const passed = items.filter((item) => item.status === "pass").length;
  const failed = items.filter((item) => item.status === "fail").length;
  const pending = items.filter((item) => item.status === "pending").length;

  return [
    "# Vishvakarma.OS Device Validation Proof",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Path: ${window.location.pathname}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight}`,
    `Visual viewport: ${window.visualViewport ? `${Math.round(window.visualViewport.width)}x${Math.round(window.visualViewport.height)}` : "not available"}`,
    `User agent: ${navigator.userAgent}`,
    "",
    "## Summary",
    "",
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Pending: ${pending}`,
    "",
    "## Manual checks",
    "",
    ...items.map((item) => `- [${item.status === "pass" ? "x" : " "}] ${item.title} — ${item.status.toUpperCase()} — ${item.detail}`),
    "",
    "## Automatic scan",
    "",
    ...(autoScan.length ? autoScan.map((line) => `- ${line}`) : ["- No automatic scan run yet."]),
    "",
  ].join("\n");
}

export function DeviceValidationPanel() {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<Record<string, ValidationStatus>>({});
  const [autoScan, setAutoScan] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStored(readStored());
  }, []);

  const items = useMemo(
    () =>
      baseChecks.map((item) => ({
        ...item,
        status: stored[item.id] || item.status,
      })),
    [stored],
  );

  function setItemStatus(id: string, status: ValidationStatus) {
    const next = { ...stored, [id]: status };
    setStored(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function runAutoScan() {
    const lines: string[] = [];

    const width = window.innerWidth;
    const height = window.innerHeight;
    const visual = window.visualViewport;

    lines.push(`Layout viewport detected at ${width}x${height}.`);

    if (visual) {
      lines.push(`Dynamic visual viewport detected at ${Math.round(visual.width)}x${Math.round(visual.height)}.`);
    } else {
      lines.push("VisualViewport API unavailable; manual dynamic viewport check required.");
    }

    const bodyStyle = window.getComputedStyle(document.body);
    lines.push(`Body overscroll-behavior-y: ${bodyStyle.overscrollBehaviorY || "not reported"}.`);

    const interactive = Array.from(
      document.querySelectorAll<HTMLElement>("button, a, input, select, textarea, [role='button'], [tabindex]"),
    ).filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    const smallTargets = interactive.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    });

    lines.push(`Interactive controls scanned: ${interactive.length}.`);
    lines.push(`Potential touch targets below 44px: ${smallTargets.length}.`);

    const offscreen = interactive.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left < 0 || rect.top < 0 || rect.right > width || rect.bottom > height;
    });

    lines.push(`Potential offscreen interactive controls: ${offscreen.length}.`);

    if (smallTargets.length === 0 && offscreen.length === 0) {
      lines.push("Automatic scan result: no obvious touch/offscreen issues in current viewport.");
    } else {
      lines.push("Automatic scan result: review highlighted counts manually before release proof.");
    }

    setAutoScan(lines);
  }

  async function copyReport() {
    const report = buildMarkdownReport(items, autoScan);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      window.prompt("Copy validation report", report);
    }
  }

  const passed = items.filter((item) => item.status === "pass").length;

  return (
    <section className="vish-device-validation" aria-label="Device validation proof mode">
      <button
        className="vish-device-validation__launcher"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>QA</span>
        <strong>{passed}/{items.length}</strong>
      </button>

      {open ? (
        <div className="vish-device-validation__panel" role="dialog" aria-modal="false" aria-label="Device validation checklist">
          <header className="vish-device-validation__header">
            <div>
              <p>Vishvakarma.OS</p>
              <h2>Device Validation</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close device validation">
              ×
            </button>
          </header>

          <div className="vish-device-validation__actions">
            <button type="button" onClick={runAutoScan}>Run scan</button>
            <button type="button" onClick={copyReport}>{copied ? "Copied" : "Copy proof"}</button>
          </div>

          <div className="vish-device-validation__meta">
            <span>{window.innerWidth}×{window.innerHeight}</span>
            <span>{passed}/{items.length} passed</span>
          </div>

          <ol className="vish-device-validation__checks">
            {items.map((item) => (
              <li key={item.id} data-status={item.status}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="vish-device-validation__check-actions">
                  <button type="button" onClick={() => setItemStatus(item.id, "pass")}>Pass</button>
                  <button type="button" onClick={() => setItemStatus(item.id, "fail")}>Fail</button>
                  <button type="button" onClick={() => setItemStatus(item.id, "pending")}>Reset</button>
                </div>
              </li>
            ))}
          </ol>

          {autoScan.length ? (
            <div className="vish-device-validation__scan">
              <h3>Automatic scan</h3>
              <ul>
                {autoScan.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
