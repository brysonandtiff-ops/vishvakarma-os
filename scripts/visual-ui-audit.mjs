/**
 * Full visual UI audit — captures screenshots + axe violations per route.
 * Usage: SHOT_BASE=http://127.0.0.1:5173 node scripts/visual-ui-audit.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:5173';
const OUT = process.env.AUDIT_OUT ?? '/tmp/ui-audit';
const CRITICAL_RULES = ['color-contrast', 'document-title', 'html-has-lang', 'image-alt', 'label'];

const ROUTES = [
  { path: '/', name: 'landing', group: 'marketing' },
  { path: '/features', name: 'features', group: 'marketing' },
  { path: '/pricing', name: 'pricing', group: 'marketing' },
  { path: '/auth', name: 'auth', group: 'marketing' },
  { path: '/404', name: 'not-found', group: 'marketing' },
  { path: '/editor', name: 'editor', group: 'editor', setup: 'editor' },
  { path: '/3d-room', name: '3d-room', group: 'editor' },
  { path: '/projects', name: 'projects', group: 'workspace' },
  { path: '/profile', name: 'profile', group: 'workspace' },
  { path: '/optimization', name: 'optimization', group: 'governance' },
  { path: '/spec-center', name: 'spec-center', group: 'governance' },
  { path: '/registry', name: 'registry', group: 'governance' },
  { path: '/change-requests', name: 'change-requests', group: 'governance' },
  { path: '/releases', name: 'releases', group: 'governance' },
  { path: '/world-records', name: 'world-records', group: 'governance' },
  { path: '/audit', name: 'audit', group: 'governance' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});

await context.addInitScript(() => {
  window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
  window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
  window.localStorage.setItem('vishvakarma-analytics-consent', 'false');
});

const page = await context.newPage();
const report = { base: BASE, routes: [], layoutIssues: [], consoleErrors: [] };

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    report.consoleErrors.push({ text: msg.text(), url: page.url() });
  }
});

async function dismissOverlays() {
  for (const name of [/decline/i, /discard draft/i, /dismiss guided start/i, /dismiss notification/i]) {
    const btn = page.getByRole('button', { name });
    if (await btn.first().isVisible().catch(() => false)) {
      await btn.first().click({ force: true }).catch(() => {});
    }
  }
}

async function checkLayoutIssues(routeName) {
  const issues = await page.evaluate(() => {
    const found = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal overflow
    const scrollW = document.documentElement.scrollWidth;
    if (scrollW > vw + 2) {
      found.push({ type: 'horizontal-overflow', scrollWidth: scrollW, viewportWidth: vw });
    }

    // Zero-size interactive elements
    for (const el of document.querySelectorAll('button, a, input, select, textarea, [role="button"]')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 && r.height === 0 && cs.display !== 'none' && cs.visibility !== 'hidden') {
        const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || el.tagName;
        found.push({ type: 'zero-size-interactive', label });
      }
    }

    // Low contrast text (quick heuristic: same color as bg)
    for (const el of document.querySelectorAll('p, span, h1, h2, h3, h4, label, button, a')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const text = el.textContent?.trim();
      if (!text || text.length < 2) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const fg = cs.color;
      const bg = cs.backgroundColor;
      if (fg === bg && fg !== 'rgba(0, 0, 0, 0)') {
        found.push({ type: 'fg-equals-bg', text: text.slice(0, 60), fg, bg });
      }
    }

    // Elements clipped outside viewport (major UI)
    for (const sel of ['[data-testid="editor-top-bar"]', 'nav', 'header', '.ws-status-bar']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) {
        found.push({ type: 'offscreen-chrome', selector: sel, rect: { x: r.x, y: r.y, w: r.width, h: r.height } });
      }
    }

    return found;
  });
  for (const issue of issues) {
    report.layoutIssues.push({ route: routeName, ...issue });
  }
}

for (const route of ROUTES) {
  const entry = { ...route, violations: [], screenshot: null, error: null };
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(route.setup === 'editor' ? 2500 : 800);
    await dismissOverlays();
    await page.waitForTimeout(500);

    const shotPath = join(OUT, `${route.group}-${route.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: route.group === 'marketing' });
    entry.screenshot = shotPath;

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    entry.violations = axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      critical: CRITICAL_RULES.includes(v.id),
    }));

    await checkLayoutIssues(route.name);
  } catch (err) {
    entry.error = String(err);
  }
  report.routes.push(entry);
  console.log(
    `[${route.name}] violations=${entry.violations?.length ?? '?'} critical=${entry.violations?.filter((v) => v.critical).length ?? 0} error=${entry.error ? 'YES' : 'no'}`,
  );
}

// Mobile viewport spot-check
await page.setViewportSize({ width: 390, height: 844 });
for (const route of [{ path: '/', name: 'landing-mobile' }, { path: '/editor', name: 'editor-mobile' }]) {
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await dismissOverlays();
    const shotPath = join(OUT, `${route.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    await checkLayoutIssues(route.name);
  } catch (err) {
    report.layoutIssues.push({ route: route.name, type: 'capture-error', error: String(err) });
  }
}

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

const criticalCount = report.routes.reduce(
  (n, r) => n + (r.violations?.filter((v) => v.critical).length ?? 0),
  0,
);
console.log('\n=== AUDIT SUMMARY ===');
console.log(`Routes: ${report.routes.length}`);
console.log(`Critical a11y violations: ${criticalCount}`);
console.log(`Layout issues: ${report.layoutIssues.length}`);
console.log(`Console errors: ${report.consoleErrors.length}`);
console.log(`Report: ${join(OUT, 'report.json')}`);

if (criticalCount > 0 || report.layoutIssues.length > 0) {
  console.log('\n--- Critical violations ---');
  for (const r of report.routes) {
    for (const v of r.violations?.filter((v) => v.critical) ?? []) {
      console.log(`  ${r.name}: ${v.id} — ${v.help} (${v.nodes} nodes)`);
    }
  }
  console.log('\n--- Layout issues ---');
  for (const i of report.layoutIssues.slice(0, 20)) {
    console.log(`  ${i.route}: ${i.type}`, JSON.stringify(i).slice(0, 120));
  }
}

process.exit(criticalCount > 0 ? 1 : 0);
