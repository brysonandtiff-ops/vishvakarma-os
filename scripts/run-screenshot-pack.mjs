#!/usr/bin/env node
/** Build e2e preview with local editor access, start preview, capture screenshots, then exit. */
import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT ?? '4173';
const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${previewPort}`;

const env = {
  ...process.env,
  VITE_BACKEND_PROVIDER: 'supabase',
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
  PLAYWRIGHT_REUSE_SERVER: '1',
  PLAYWRIGHT_BASE_URL: previewUrl,
};

function run(command) {
  execSync(command, { stdio: 'inherit', env, shell: true });
}

function freePreviewPort() {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${previewPort} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore' },
      );
    } else {
      execSync(`lsof -ti:${previewPort} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore', shell: true });
    }
  } catch {
    // port already free
  }
}

async function waitForPreview(maxMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const response = await fetch(previewUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok || response.status === 404) return;
    } catch {
      // preview still starting
    }
    await delay(500);
  }
  throw new Error(`Preview server did not start at ${previewUrl}`);
}

run('pnpm exec vite build --mode e2e');
freePreviewPort();
await delay(1000);

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', previewPort], {
  env,
  stdio: 'inherit',
  shell: true,
});

try {
  await waitForPreview();
  run('pnpm exec playwright test --project=screenshot-pack');
} finally {
  preview.kill('SIGTERM');
  freePreviewPort();
}

