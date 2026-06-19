import { chromium } from '@playwright/test';
const BASE = 'http://127.0.0.1:5180';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('vishvakarma-analytics-consent', 'declined'); } catch {} });
const page = await ctx.newPage();
for (const [name, path] of [['optimization','/optimization'],['world-records','/world-records']]) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `tmp-qa/${name}-d2.png`, fullPage: false });
}
await browser.close();
console.log('done');
