#!/usr/bin/env node
/**
 * Opens a URL in Google Chrome when available, otherwise the OS default browser.
 * Avoids `cmd /c start` + shell:true, which can hang in integrated terminals.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
    : null,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function resolveChromeExecutable() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function launchDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  return child.pid != null;
}

export function openExternalUrl(url, { preferChrome = true } = {}) {
  if (!url?.trim()) {
    return { ok: false, method: 'none', error: 'Missing URL' };
  }

  if (preferChrome) {
    const chrome = resolveChromeExecutable();
    if (chrome && launchDetached(chrome, [url])) {
      return { ok: true, method: 'chrome', executable: chrome };
    }
  }

  if (process.platform === 'win32') {
    const escaped = url.replace(/'/g, "''");
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        `Start-Process -FilePath '${escaped}'`,
      ],
      { encoding: 'utf8', windowsHide: true }
    );
    if (result.status === 0) {
      return { ok: true, method: 'default-handler' };
    }
    return { ok: false, method: 'default-handler', error: result.stderr?.trim() || result.stdout?.trim() };
  }

  if (process.platform === 'darwin') {
    if (launchDetached('open', ['-a', 'Google Chrome', url])) {
      return { ok: true, method: 'chrome' };
    }
    if (launchDetached('open', [url])) {
      return { ok: true, method: 'default-handler' };
    }
    return { ok: false, method: 'open', error: 'open command failed' };
  }

  if (launchDetached('xdg-open', [url])) {
    return { ok: true, method: 'default-handler' };
  }

  return { ok: false, method: 'xdg-open', error: 'xdg-open failed' };
}

if (process.argv[1]?.includes('open-external-url.mjs')) {
  const url = process.argv[2];
  const result = openExternalUrl(url);
  if (!result.ok) {
    console.error('[FAIL]', result.error ?? 'Could not open URL');
    console.error(url);
    process.exit(1);
  }
  console.log(`[OK] Opened via ${result.method}${result.executable ? ` (${result.executable})` : ''}`);
}
