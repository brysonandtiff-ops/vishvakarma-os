#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const headersPath = join(process.cwd(), 'public', '_headers');
const failures = [];

if (!existsSync(headersPath)) {
  failures.push('Missing public/_headers');
} else {
  const headers = readFileSync(headersPath, 'utf8');
  const requiredHeaders = [
    'Content-Security-Policy:',
    'Strict-Transport-Security:',
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
    'Referrer-Policy:',
    'Permissions-Policy:',
  ];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) failures.push(`Missing required production header: ${header}`);
  }

  const requiredCspDirectives = [
    "default-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  for (const directive of requiredCspDirectives) {
    if (!headers.includes(directive)) failures.push(`Content-Security-Policy missing directive: ${directive}`);
  }

  for (const hstsToken of ['max-age=63072000', 'includeSubDomains']) {
    if (!headers.includes(hstsToken)) failures.push(`Strict-Transport-Security missing ${hstsToken}`);
  }

  for (const blockedFeature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()']) {
    if (!headers.includes(blockedFeature)) failures.push(`Permissions-Policy must include ${blockedFeature}`);
  }

  for (const cacheRule of [
    '/build-meta.json',
    'no-store, max-age=0, must-revalidate',
    '/sw.js',
    'public, max-age=0, must-revalidate',
  ]) {
    if (!headers.includes(cacheRule)) failures.push(`Cloudflare cache policy missing ${cacheRule}`);
  }
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS Cloudflare security header check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS Cloudflare security header check passed.');
console.log('Required Pages security headers, CSP directives, and cache policies are present.');
