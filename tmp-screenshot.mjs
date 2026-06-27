import { chromium } from '@playwright/test';

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:5173';
const OUT = process.env.SHOT_OUT ?? '/tmp/editor-dev.png';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1194, height: 834 }, hasTouch: true, deviceScaleFactor: 2 });
const page = await context.newPage();

await page.addInitScript(() => {
  window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
  window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
});

await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.setViewportSize({ width: 1195, height: 835 });
await page.waitForTimeout(1500);

// dismiss any blocking chrome
for (const name of [/discard draft/i, /dismiss guided start/i, /decline/i]) {
  const b = page.getByRole('button', { name });
  if (await b.first().isVisible().catch(() => false)) await b.first().click({ force: true }).catch(() => {});
}
await page.waitForTimeout(500);

// draw a wall via Wall tool + pointer events
async function activate(label) {
  const button = page.getByRole('button', { name: label }).first();
  await button.evaluate((el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}
async function ptr(canvas, type, pos) {
  await canvas.evaluate((el, { type, pos }) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: r.left + pos.x, clientY: r.top + pos.y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
  }, { type, pos });
}

const canvas = page.getByTestId('blueprint-canvas');
if (await canvas.isVisible().catch(() => false)) {
  const box = await canvas.boundingBox();
  await activate('Wall');
  await ptr(canvas, 'pointerdown', { x: box.width * 0.25, y: box.height * 0.4 });
  await ptr(canvas, 'pointerup', { x: box.width * 0.75, y: box.height * 0.4 });
  await page.waitForTimeout(300);
  await activate('Wall');
  await ptr(canvas, 'pointerdown', { x: box.width * 0.75, y: box.height * 0.4 });
  await ptr(canvas, 'pointerup', { x: box.width * 0.75, y: box.height * 0.7 });
  await page.waitForTimeout(300);
  await activate('Door');
  await ptr(canvas, 'pointerdown', { x: box.width * 0.5, y: box.height * 0.4 });
  await ptr(canvas, 'pointerup', { x: box.width * 0.5, y: box.height * 0.4 });
  await page.waitForTimeout(500);
}

const statusText = await page.locator('.ws-status-bar').textContent().catch(() => 'n/a');
console.log('STATUS BAR:', statusText);

const geom = await canvas.evaluate((el) => {
  const chain = [];
  let node = el;
  for (let i = 0; i < 10 && node; i++) {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    chain.push({ tag: node.tagName, cls: (node.className || '').toString().slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), flex: cs.flex, display: cs.display, overflow: cs.overflow });
    node = node.parentElement;
  }
  return chain;
}).catch((e) => ({ err: String(e) }));
console.log('ANCESTOR CHAIN:', JSON.stringify(geom, null, 1));

await page.screenshot({ path: OUT, fullPage: false });
await canvas.screenshot({ path: OUT.replace('.png', '-canvas.png') }).catch((e) => console.log('canvas shot err', String(e)));
console.log('Saved screenshot to', OUT);
await browser.close();
