#!/usr/bin/env node
/** Derives self-contained PWA / favicon SVGs from public/brand/vishvakarma-official-logo.svg */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const officialLogoPath = join(root, 'public', 'brand', 'vishvakarma-official-logo.svg');

const EMBEDDED_IMAGE_RE = /href="(data:image\/webp;base64,[^"]+)"/;

function readEmbeddedImageHref() {
  if (!existsSync(officialLogoPath)) {
    throw new Error(`Missing official logo: ${officialLogoPath}`);
  }

  const source = readFileSync(officialLogoPath, 'utf8');
  const match = source.match(EMBEDDED_IMAGE_RE);
  if (!match) {
    throw new Error('Official logo SVG has no embedded data:image/webp;base64 artwork');
  }

  return match[1];
}

function buildIconSvg({ size, imageHref, background, paddingRatio = 0, label }) {
  const pad = Math.round(size * paddingRatio);
  const imageSize = size - pad * 2;

  const backgroundRect =
    background != null
      ? `<rect width="${size}" height="${size}" fill="${background}"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label}">
  <title>${label}</title>
  ${backgroundRect}
  <image href="${imageHref}" x="${pad}" y="${pad}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
}

function writeSvg(relativePath, content) {
  const outPath = join(root, relativePath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, 'utf8');
  console.log(`Wrote ${relativePath}`);
}

const imageHref = readEmbeddedImageHref();
const label = 'Vishvakarma.OS official swan V logo';
const background = '#17120c';

writeSvg(
  'public/icons/icon.svg',
  buildIconSvg({ size: 512, imageHref, label }),
);

writeSvg(
  'public/icons/apple-touch-icon.svg',
  buildIconSvg({ size: 180, imageHref, background, label }),
);

writeSvg(
  'public/icons/maskable.svg',
  buildIconSvg({ size: 512, imageHref, background, paddingRatio: 0.14, label }),
);

writeSvg(
  'public/images/logo/logo-icon.svg',
  buildIconSvg({ size: 32, imageHref, label }),
);

writeSvg(
  'public/images/logo/auth-logo.svg',
  buildIconSvg({ size: 48, imageHref, label }),
);

writeSvg(
  'public/images/logo/logo-dark.svg',
  buildIconSvg({ size: 48, imageHref, background, paddingRatio: 0.08, label }),
);
