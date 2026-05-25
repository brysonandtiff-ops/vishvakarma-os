#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const vercelPath = join(process.cwd(), 'vercel.json');
const failures = [];

if (!existsSync(vercelPath)) {
  failures.push('Missing vercel.json');
} else {
  const raw = readFileSync(vercelPath, 'utf8');
  let config;

  try {
    config = JSON.parse(raw);
  } catch (error) {
    failures.push(`vercel.json is not valid JSON: ${error.message}`);
  }

  if (config) {
    const allHeaders = (config.headers ?? []).flatMap((entry) => entry.headers ?? []);
    const headerMap = new Map(allHeaders.map((header) => [header.key, header.value]));

    const requiredHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ];

    for (const header of requiredHeaders) {
      if (!headerMap.has(header)) {
        failures.push(`Missing required production header: ${header}`);
      }
    }

    const csp = headerMap.get('Content-Security-Policy') ?? '';
    const requiredCspDirectives = [
      "default-src 'self'",
      'object-src \'none\'',
      'frame-ancestors \'none\'',
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ];

    for (const directive of requiredCspDirectives) {
      if (!csp.includes(directive)) {
        failures.push(`Content-Security-Policy missing directive: ${directive}`);
      }
    }

    const hsts = headerMap.get('Strict-Transport-Security') ?? '';
    if (!hsts.includes('max-age=63072000')) {
      failures.push('Strict-Transport-Security must include max-age=63072000.');
    }
    if (!hsts.includes('includeSubDomains')) {
      failures.push('Strict-Transport-Security must include includeSubDomains.');
    }

    const permissions = headerMap.get('Permissions-Policy') ?? '';
    for (const blockedFeature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()']) {
      if (!permissions.includes(blockedFeature)) {
        failures.push(`Permissions-Policy must include ${blockedFeature}.`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS Vercel security header check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Vishvakarma.OS Vercel security header check passed.');
console.log('Required production security headers and CSP directives are present.');
