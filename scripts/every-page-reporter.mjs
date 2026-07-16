import { mkdirSync, writeFileSync } from 'node:fs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeError(error) {
  if (!error) return '';
  const message = error.message || error.value || String(error);
  return message.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 1600);
}

export default class EveryPageReporter {
  constructor() {
    this.results = [];
    this.startedAt = new Date().toISOString();
  }

  onTestEnd(test, result) {
    const match = test.title.match(/^(.*) \[([^\]]+)\]$/);
    this.results.push({
      page: match?.[1] ?? test.title,
      device: match?.[2] ?? 'unknown',
      status: result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIP' : 'FAIL',
      durationMs: result.duration,
      retry: result.retry,
      error: normalizeError(result.error),
    });
  }

  onEnd(fullResult) {
    mkdirSync('dist', { recursive: true });
    const checks = [...this.results].sort((a, b) =>
      a.page.localeCompare(b.page) || a.device.localeCompare(b.device),
    );
    const pageNames = [...new Set(checks.map((row) => row.page))];
    const pages = pageNames.map((page) => {
      const devices = checks.filter((row) => row.page === page);
      return {
        page,
        status: devices.every((row) => row.status === 'PASS')
          ? 'PASS'
          : devices.some((row) => row.status === 'FAIL')
            ? 'FAIL'
            : 'SKIP',
        devices,
      };
    });

    const pass = checks.filter((row) => row.status === 'PASS').length;
    const fail = checks.filter((row) => row.status === 'FAIL').length;
    const skip = checks.filter((row) => row.status === 'SKIP').length;
    const report = {
      status: fail === 0 ? 'PASS' : 'FAIL',
      startedAt: this.startedAt,
      completedAt: new Date().toISOString(),
      playwrightStatus: fullResult.status,
      totals: { pages: pages.length, checks: checks.length, pass, fail, skip },
      pages,
      checks,
    };

    writeFileSync('dist/every-page-audit.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    const tableRows = checks.map((row) => `
      <tr class="${row.status.toLowerCase()}">
        <td>${escapeHtml(row.page)}</td>
        <td>${escapeHtml(row.device)}</td>
        <td><strong>${row.status}</strong></td>
        <td>${Math.round(row.durationMs / 100) / 10}s</td>
        <td><pre>${escapeHtml(row.error)}</pre></td>
      </tr>`).join('');

    const pageRows = pages.map((row) => `
      <tr class="${row.status.toLowerCase()}">
        <td>${escapeHtml(row.page)}</td>
        <td><strong>${row.status}</strong></td>
        <td>${row.devices.map((device) => `${escapeHtml(device.device)}: ${device.status}`).join(' · ')}</td>
      </tr>`).join('');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Vishvakarma.OS Every-Page Audit</title>
  <style>
    body{font-family:ui-sans-serif,system-ui;background:#08101f;color:#edf4ff;margin:0;padding:24px}
    h1,h2{margin:0 0 16px} .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 28px}
    .pill{border:1px solid #385078;border-radius:999px;padding:8px 12px;background:#101c33}
    table{width:100%;border-collapse:collapse;margin:0 0 32px;background:#0d1729}
    th,td{text-align:left;vertical-align:top;border:1px solid #263b60;padding:10px}
    th{background:#14233d} tr.pass strong{color:#68e6a5} tr.fail strong{color:#ff7e88} tr.skip strong{color:#ffd36a}
    pre{white-space:pre-wrap;max-width:760px;margin:0;font:12px/1.45 ui-monospace,monospace;color:#ffb7bd}
  </style>
</head>
<body>
  <h1>Vishvakarma.OS Every-Page Audit</h1>
  <div class="summary">
    <span class="pill">Overall: <strong>${report.status}</strong></span>
    <span class="pill">Pages: ${report.totals.pages}</span>
    <span class="pill">Checks: ${report.totals.checks}</span>
    <span class="pill">Pass: ${pass}</span>
    <span class="pill">Fail: ${fail}</span>
    <span class="pill">Skip: ${skip}</span>
  </div>
  <h2>Page summary</h2>
  <table><thead><tr><th>Page</th><th>Status</th><th>Devices</th></tr></thead><tbody>${pageRows}</tbody></table>
  <h2>All checks</h2>
  <table><thead><tr><th>Page</th><th>Device</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead><tbody>${tableRows}</tbody></table>
</body>
</html>`;
    writeFileSync('dist/index.html', html, 'utf8');
  }
}
