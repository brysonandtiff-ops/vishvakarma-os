#!/usr/bin/env node
/**
 * Saves sk_live_ into .env.stripe.local.
 * Default: opens a paste dialog (Windows/macOS) or terminal prompt.
 * Usage:
 *   pnpm run import:stripe-live-key
 *   pnpm run import:stripe-live-key -- --clipboard
 *   pnpm run import:stripe-live-key -- --file=path/to/key.txt
 */

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync } from 'node:fs';

const PROMPT_MESSAGE =
  'Paste your Stripe live secret key (sk_live_...) from Dashboard → API keys';

function readClipboard() {
  if (process.platform === 'win32') {
    const clip = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], {
      encoding: 'utf8',
    });
    return clip.stdout?.trim() ?? '';
  }
  if (process.platform === 'darwin') {
    const clip = spawnSync('pbpaste', [], { encoding: 'utf8' });
    return clip.stdout?.trim() ?? '';
  }
  throw new Error('Clipboard import is supported on Windows and macOS only.');
}

function promptWithDialog() {
  if (process.platform === 'win32') {
    console.log('[INFO] Opening Stripe key paste dialog — check the taskbar if it is behind this window.');
    const ps = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Stripe Live Secret Key'
$form.Size = New-Object System.Drawing.Size(540, 190)
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$label = New-Object System.Windows.Forms.Label
$label.Text = '${PROMPT_MESSAGE.replace(/'/g, "''")}'
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(12, 12)
$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(12, 44)
$textBox.Size = New-Object System.Drawing.Size(500, 23)
$textBox.Font = New-Object System.Drawing.Font('Consolas', 10)
$ok = New-Object System.Windows.Forms.Button
$ok.Text = 'Save'
$ok.Location = New-Object System.Drawing.Point(210, 88)
$ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $ok
$form.Controls.AddRange(@($label, $textBox, $ok))
$form.Add_Shown({ $form.Activate(); $textBox.Focus() })
if ($form.ShowDialog() -eq 'OK') { Write-Output $textBox.Text.Trim() }
`;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-STA', '-Command', ps], { encoding: 'utf8' });
    return result.stdout?.trim() ?? '';
  }

  if (process.platform === 'darwin') {
    console.log('[INFO] Opening Stripe key paste dialog.');
    const script =
      'text returned of (display dialog "Paste your Stripe live secret key (sk_live_...):" default answer "" with title "Stripe Live Secret Key")';
    const result = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
    return result.stdout?.trim() ?? '';
  }

  return null;
}

async function promptWithTerminal() {
  console.log(`[INFO] ${PROMPT_MESSAGE}`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('sk_live_... ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptForKey() {
  const fromDialog = promptWithDialog();
  if (fromDialog !== null && fromDialog.length > 0) return fromDialog;
  if (fromDialog !== null) {
    console.log('[INFO] Dialog empty or canceled — paste in the terminal instead.');
  }
  return promptWithTerminal();
}

function extractSkLive(raw) {
  return raw.match(/sk_live_[A-Za-z0-9]+/)?.[0] ?? '';
}

function saveKey(key) {
  const result = spawnSync(process.execPath, ['scripts/set-stripe-secret-env.mjs', key], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

async function main() {
  if (!existsSync('.env.stripe.local')) {
    console.error('[FAIL] Missing .env.stripe.local — run provision:firebase-service-account first.');
    process.exit(1);
  }

  const useClipboard = process.argv.includes('--clipboard');
  const fileArg = process.argv.find((arg) => arg.startsWith('--file='))?.slice('--file='.length);

  let raw = '';
  if (fileArg) {
    raw = readFileSync(fileArg, 'utf8');
  } else if (useClipboard) {
    try {
      raw = readClipboard();
    } catch (error) {
      console.error(`[FAIL] ${error.message}`);
      process.exit(1);
    }
  } else {
    raw = await promptForKey();
  }

  const key = extractSkLive(raw);
  if (!key) {
    if (/^pk_live_/.test(raw.trim())) {
      console.error('[FAIL] That is a publishable key (pk_live_). You need the secret key (sk_live_...) from the same page.');
    } else if (/^rk_live_/.test(raw.trim())) {
      console.error('[FAIL] That is a restricted key (rk_live_). Reveal the secret key (sk_live_...) in Stripe Dashboard → API keys.');
    } else if (/^mk_/.test(raw.trim())) {
      console.error('[FAIL] That looks like an ID fragment, not a secret key. Copy the full sk_live_... string (Reveal live key).');
    } else if (useClipboard) {
      console.error('[FAIL] Clipboard does not contain sk_live_... Copy it from Stripe Dashboard → API keys first.');
      console.error('[INFO] Re-run without --clipboard to paste into a dialog instead.');
    } else if (fileArg) {
      console.error('[FAIL] File does not contain sk_live_...');
    } else {
      console.error('[FAIL] No sk_live_ key entered.');
    }
    process.exit(1);
  }

  saveKey(key);
}

main();
