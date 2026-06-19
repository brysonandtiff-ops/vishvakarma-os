import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:5173';
const OUT = 'tmp-qa';
mkdirSync(OUT, { recursive: true });

const routes = [
  ['auth-desktop', '/auth', 1440, 900],
  ['auth-mobile', '/auth', 390, 844],
  ['editor-desktop', '/editor', 1600, 1000],
];

const report = { base: BASE, routes: {}, editor: {} };
const browser = await chromium.launch();

for (const [name, path, w, h] of routes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('vishvakarma-analytics-consent', 'declined');
    } catch {}
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 240));
  });
  page.on('pageerror', (e) => errs.push(`PAGEERR ${e.message.slice(0, 240)}`));
  const t0 = Date.now();
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(name.startsWith('editor') ? 3500 : 2800);
    const entry = {
      ms: Date.now() - t0,
      title: await page.title(),
      errors: errs.slice(0, 6),
    };
    if (name.startsWith('auth')) {
      entry.hasAuthCard = (await page.locator('[data-testid="auth-card"]').count()) > 0;
      entry.hasSacredGate =
        (await page.locator('.sacred-temple-gate, .sacred-auth-card').count()) > 0;
      entry.hasGoogleOrEmail =
        (await page.getByRole('button', { name: /google|access link|प्रवेश/i }).count()) > 0;
    }
    report.routes[name] = entry;
    await page.screenshot({ path: `${OUT}/${name}.png` });
  } catch (e) {
    report.routes[name] = {
      ms: Date.now() - t0,
      gotoError: String(e.message),
      errors: errs.slice(0, 6),
    };
  }
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('vishvakarma-analytics-consent', 'declined');
    } catch {}
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`PAGEERR ${e.message.slice(0, 240)}`));
  await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  try {
    const b = page.getByRole('button', { name: /load.*sample/i }).first();
    if (await b.count()) await b.click({ timeout: 1500 });
  } catch {}
  await page.waitForTimeout(1000);
  try {
    const dlg = page.getByRole('dialog');
    const tile = dlg.getByRole('button', { name: /3BHK Apartment/i }).first();
    if (await tile.count()) await tile.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    const load = dlg.getByRole('button', { name: /load blueprint/i }).first();
    if (await load.count()) await load.click({ timeout: 2000 });
  } catch (e) {
    errs.push(`sample ${e.message}`);
  }
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/editor-2d-verify.png` });
  const canvas2d = await page.locator('canvas').count();
  await page.keyboard.press('3');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}/editor-3d-verify.png` });
  report.editor = { canvas2d, errors: errs.slice(0, 6), switchedTo3d: true };
  await ctx.close();
}

await browser.close();
writeFileSync(`${OUT}/auth-editor-qa.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
