import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5180';
const OUT = 'tmp-qa';
mkdirSync(OUT, { recursive: true });

const routes = [
  ['landing', '/'],
  ['features', '/features'],
  ['pricing', '/pricing'],
  ['auth', '/auth'],
  ['projects', '/projects'],
  ['profile', '/profile'],
  ['optimization', '/optimization'],
  ['spec-center', '/spec-center'],
  ['registry', '/registry'],
  ['change-requests', '/change-requests'],
  ['releases', '/releases'],
  ['world-records', '/world-records'],
  ['audit', '/audit'],
];

const browser = await chromium.launch();
const errors = {};

async function capture(vp, label, w, h, list) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem('vishvakarma-analytics-consent', 'declined'); } catch {} });
  const page = await ctx.newPage();
  for (const [name, path] of list) {
    const key = `${name}-${label}`;
    const errs = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 200)));
    try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { errs.push('goto ' + e.message); }
    await page.waitForTimeout(2800);
    await page.screenshot({ path: `${OUT}/${key}.png`, fullPage: false });
    if (errs.length) errors[key] = errs.slice(0, 6);
  }
  await ctx.close();
}

await capture('desktop', 'd', 1440, 900, routes);
await capture('mobile', 'm', 390, 844, routes);

// Editor with a sample loaded
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('vishvakarma-analytics-consent', 'declined'); } catch {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 200)));
  await page.goto(BASE + '/editor', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  try { const b = page.getByRole('button', { name: /load.*sample/i }).first(); if (await b.count()) await b.click({ timeout: 1500 }); } catch {}
  await page.waitForTimeout(1000);
  try {
    const dlg = page.getByRole('dialog');
    const tile = dlg.getByRole('button', { name: /3BHK Apartment/i }).first();
    if (await tile.count()) await tile.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    const load = dlg.getByRole('button', { name: /load blueprint/i }).first();
    if (await load.count()) await load.click({ timeout: 2000 });
  } catch (e) { errs.push('sample ' + e.message); }
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/editor-2d-d.png` });
  await page.keyboard.press('3');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}/editor-3d-d.png` });
  if (errs.length) errors['editor'] = errs.slice(0, 6);
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(errors, null, 2));
