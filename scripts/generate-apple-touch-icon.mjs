#!/usr/bin/env node
/** Renders public/brand/vishvakarma-apple-touch-icon.png (180×180) from the official SVG. */
import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'public', 'brand', 'vishvakarma-official-logo.svg');
const outPath = join(root, 'public', 'brand', 'vishvakarma-apple-touch-icon.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
await page.setContent(
  `<!DOCTYPE html><html><body style="margin:0;background:#17120c;display:flex;align-items:center;justify-content:center;width:180px;height:180px">
  <img src="${pathToFileURL(svgPath).href}" width="160" height="160" alt="" />
</body></html>`,
  { waitUntil: 'networkidle' },
);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();
console.log(`Wrote ${outPath}`);
