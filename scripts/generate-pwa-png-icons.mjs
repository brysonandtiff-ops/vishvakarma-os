#!/usr/bin/env node
/** Renders PWA / touch PNG icons from self-contained public/icons/*.svg artwork. */
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const OUTPUTS = [
  {
    svgPath: join(root, 'public', 'icons', 'apple-touch-icon.svg'),
    outPath: join(root, 'public', 'brand', 'vishvakarma-apple-touch-icon.png'),
    size: 180,
    paddingRatio: 0,
  },
  {
    svgPath: join(root, 'public', 'icons', 'icon.svg'),
    outPath: join(root, 'public', 'icons', 'icon-192.png'),
    size: 192,
    paddingRatio: 0,
  },
  {
    svgPath: join(root, 'public', 'icons', 'icon.svg'),
    outPath: join(root, 'public', 'icons', 'icon-512.png'),
    size: 512,
    paddingRatio: 0,
  },
  {
    svgPath: join(root, 'public', 'icons', 'icon.svg'),
    outPath: join(root, 'public', 'icons', 'favicon-32.png'),
    size: 32,
    paddingRatio: 0,
  },
];

function buildPageHtml(svgMarkup, size, paddingRatio) {
  const pad = Math.round(size * paddingRatio);
  const inner = size - pad * 2;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: ${size}px;
        height: ${size}px;
        background: #17120c;
      }
      .frame {
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #17120c;
      }
      .icon {
        width: ${inner}px;
        height: ${inner}px;
      }
    </style>
  </head>
  <body>
    <div class="frame">${svgMarkup.replace('<svg', '<svg class="icon"')}</div>
  </body>
</html>`;
}

async function renderPng({ svgPath, outPath, size, paddingRatio }) {
  if (!existsSync(svgPath)) {
    throw new Error(`Missing icon SVG: ${svgPath}`);
  }

  const svgMarkup = readFileSync(svgPath, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(buildPageHtml(svgMarkup, size, paddingRatio), { waitUntil: 'load' });
  await page.waitForTimeout(250);
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();
  console.log(`Wrote ${outPath}`);
}

for (const output of OUTPUTS) {
  await renderPng(output);
}
