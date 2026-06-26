import { useEffect, useState } from "react";

type ValidationStatus = "pending" | "pass" | "fail";

type ValidationItem = {
  id: string;
  title: string;
  detail: string;
  status: ValidationStatus;
};

const STORAGE_KEY = "vish-device-validation-v1";

const baseChecks: ValidationItem[] = [
  { id: "ipad-landscape", title: "iPad 10 landscape", detail: "Confirm tool rail, panels, canvas, top bar, and safe areas are usable.", status: "pending" },
  { id: "ipad-portrait", title: "iPad 10 portrait", detail: "Confirm controls stay visible and the page does not gray-bounce.", status: "pending" },
  { id: "mobile", title: "Mobile portrait", detail: "Confirm auth, landing, projects, editor, and governance pages are usable.", status: "pending" },
  { id: "desktop", title: "Desktop", detail: "Confirm the full-size desktop workflow still works.", status: "pending" },
  { id: "editor", title: "Editor open", detail: "Confirm canvas, grid, tool rail, and properties panel are reachable.", status: "pending" },
  { id: "tour", title: "Grid, demo, voice tour", detail: "Confirm guided demo, grid toggle, and tour controls are not dead.", status: "pending" },
  { id: "touch", title: "Safe area and touch targets", detail: "Confirm key controls are reachable and comfortable to tap.", status: "pending" },
];

function readStored(): Record<string, ValidationStatus> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function DeviceValidationPanel() {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<Record<string, ValidationStatus>>({});
  const [scan, setScan] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStored(readStored());
  }, []);

  const items = baseChecks.map((item) => ({
    ...item,
    status: stored[item.id] || item.status,
  }));

  const passed = items.filter((item) => item.status === "pass").length;

  function setItemStatus(id: string, status: ValidationStatus) {
    const next = { ...stored, [id]: status };
    setStored(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function runScan() {
    const width = window.innerWidth;
    const height = window.innerHeight;
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

    const offscreen = interactive.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left < 0 || rect.top < 0 || rect.right > width || rect.bottom > height;
    });

    setScan([
      `Viewport: ${width}x${height}`,
      `Interactive controls scanned: ${interactive.length}`,
      `Potential controls below 44px: ${smallTargets.length}`,
      `Potential offscreen controls: ${offscreen.length}`,
      smallTargets.length === 0 && offscreen.length === 0
        ? "Automatic scan: no obvious touch or offscreen issues in this viewport."
        : "Automatic scan: review the flagged counts manually.",
    ]);
  }

  async function copyProof() {
    const report = [
      "# Vishvakarma.OS Device Validation Proof",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Path: ${window.location.pathname}`,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`,
      "",
      "## Checks",
      ...items.map((item) => `- ${item.status.toUpperCase()}: ${item.title} - ${item.detail}`),
      "",
      "## Scan",
      ...(scan.length ? scan.map((line) => `- ${line}`) : ["- No scan run yet."]),
      "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt("Copy device validation proof", report);
    }
  }

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
            <button type="button" onClick={() => setOpen(false)} aria-label="Close device validation">Close</button>
          </header>

          <div className="vish-device-validation__actions">
            <button type="button" onClick={runScan}>Run scan</button>
            <button type="button" onClick={copyProof}>{copied ? "Copied" : "Copy proof"}</button>
          </div>

          <ol className="vish-device-validation__checks">
            {items.map((item) => (
              <li key={item.id} data-status={item.status}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <div className="vish-device-validation__check-actions">
                  <button type="button" onClick={() => setItemStatus(item.id, "pass")}>Pass</button>
                  <button type="button" onClick={() => setItemStatus(item.id, "fail")}>Fail</button>
                  <button type="button" onClick={() => setItemStatus(item.id, "pending")}>Reset</button>
                </div>
              </li>
            ))}
          </ol>

          {scan.length ? (
            <div className="vish-device-validation__scan">
              <h3>Automatic scan</h3>
              <ul>{scan.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}