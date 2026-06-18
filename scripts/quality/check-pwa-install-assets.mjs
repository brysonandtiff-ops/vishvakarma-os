#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    fail(`${label} is missing required phrase: ${phrase}`);
  }
}

function readPngSize(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing PNG icon: ${relativePath}`);
    return null;
  }

  const buffer = readFileSync(path);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    fail(`${relativePath} is not a valid PNG file.`);
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function requirePngSize(relativePath, expected) {
  const size = readPngSize(relativePath);
  if (!size) return;
  if (size.width !== expected || size.height !== expected) {
    fail(`${relativePath} must be ${expected}x${expected}; found ${size.width}x${size.height}.`);
  }
}

const manifestRaw = readRequired('public/manifest.webmanifest');
let manifest = null;
try {
  manifest = JSON.parse(manifestRaw);
} catch (error) {
  fail(`public/manifest.webmanifest is invalid JSON: ${error.message}`);
}

if (manifest) {
  const requiredManifestValues = {
    name: 'Vishvakarma.OS',
    short_name: 'Vishvakarma',
    id: '/?app=vishvakarma-os',
    start_url: '/editor?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#17120c',
    theme_color: '#17120c',
  };

  for (const [key, expected] of Object.entries(requiredManifestValues)) {
    if (manifest[key] !== expected) {
      fail(`manifest ${key} must be ${expected}; found ${manifest[key] ?? '<missing>'}.`);
    }
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const requiredIcons = [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
  ];

  for (const required of requiredIcons) {
    const found = icons.find(
      (icon) => icon.src === required.src && icon.sizes === required.sizes && icon.type === required.type,
    );
    if (!found) {
      fail(`manifest is missing icon ${required.src} (${required.sizes}, ${required.type}).`);
    }
  }

  const installPngs = icons.filter((icon) => icon.type === 'image/png');
  for (const icon of installPngs) {
    const relative = `public${icon.src}`;
    if (!existsSync(join(root, relative))) {
      fail(`manifest references missing PNG icon: ${icon.src}`);
    }
  }
}

const indexHtml = readRequired('index.html');
requirePhrase(indexHtml, '<link rel="manifest" href="/manifest.webmanifest" />', 'index.html');
requirePhrase(indexHtml, '<meta name="apple-mobile-web-app-capable" content="yes" />', 'index.html');
requirePhrase(indexHtml, '<meta name="apple-mobile-web-app-title" content="Vishvakarma.OS" />', 'index.html');
requirePhrase(indexHtml, '<link rel="apple-touch-icon" sizes="180x180" href="/brand/vishvakarma-apple-touch-icon.png" />', 'index.html');

// Startup splash + iOS launch images.
requirePhrase(indexHtml, 'id="boot-splash"', 'index.html startup splash');
requirePhrase(indexHtml, 'rel="apple-touch-startup-image"', 'index.html iOS launch images');
const startupImages = [
  { path: 'public/splash/apple-splash-750-1334.png', width: 750, height: 1334 },
  { path: 'public/splash/apple-splash-1290-2796.png', width: 1290, height: 2796 },
  { path: 'public/splash/apple-splash-2048-2732.png', width: 2048, height: 2732 },
  { path: 'public/splash/apple-splash-2732-2048.png', width: 2732, height: 2048 },
];
for (const image of startupImages) {
  const size = readPngSize(image.path);
  if (size && (size.width !== image.width || size.height !== image.height)) {
    fail(`${image.path} must be ${image.width}x${image.height}; found ${size.width}x${size.height}.`);
  }
}

const iconSvg = readRequired('public/icons/icon.svg');
requirePhrase(iconSvg, 'Vishvakarma.OS official swan V logo', 'public/icons/icon.svg');
requirePhrase(iconSvg, 'data:image/webp;base64', 'public/icons/icon.svg');

const appleSvg = readRequired('public/icons/apple-touch-icon.svg');
requirePhrase(appleSvg, 'Vishvakarma.OS official swan V logo', 'public/icons/apple-touch-icon.svg');
requirePhrase(appleSvg, 'data:image/webp;base64', 'public/icons/apple-touch-icon.svg');

readRequired('public/brand/vishvakarma-official-logo.svg');
requirePngSize('public/icons/favicon-32.png', 32);
requirePngSize('public/icons/icon-192.png', 192);
requirePngSize('public/icons/icon-512.png', 512);
requirePngSize('public/brand/vishvakarma-apple-touch-icon.png', 180);

const viteConfig = readRequired('vite.config.ts');
requirePhrase(viteConfig, 'VitePWA', 'vite.config.ts');
requirePhrase(viteConfig, "registerType: 'autoUpdate'", 'vite.config.ts');
requirePhrase(viteConfig, "includeAssets: ['icons/**/*', 'brand/**/*', 'manifest.webmanifest']", 'vite.config.ts');
requirePhrase(viteConfig, "navigateFallback: '/index.html'", 'vite.config.ts');
requirePhrase(viteConfig, 'navigateFallbackDenylist: [/^\\/api\\//]', 'vite.config.ts');
// iOS launch images are served on-demand, never precached (keeps the install lean).
requirePhrase(viteConfig, "globIgnores: ['**/splash/**']", 'vite.config.ts');

if (failures.length > 0) {
  console.error('Vishvakarma.OS PWA install asset check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS PWA install asset check passed.');
console.log('Manifest, install icon paths, Apple touch icon, service worker config, and official logo artwork are guarded.');
