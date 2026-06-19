import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('vishvakarma-analytics-consent', 'declined'); } catch {} });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5180/optimization', { waitUntil: 'domcontentloaded', timeout: 30000 });
// poll for real content (ConstraintEditor / empty-state text) vs skeleton
let resolved = 'no';
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1500);
  const txt = await page.evaluate(() => document.body.innerText);
  if (/Regenerate|constraints|Design Battle|candidates/i.test(txt)) { resolved = `yes @~${(i+1)*1.5}s`; break; }
}
await page.screenshot({ path: 'tmp-qa/optimization-d3.png' });
await browser.close();
console.log('resolved: ' + resolved);
