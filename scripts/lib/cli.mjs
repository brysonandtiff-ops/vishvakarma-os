#!/usr/bin/env node

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set();
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const body = token.slice(2);
    if (body.includes('=')) {
      const [key, value] = body.split('=');
      options[key] = value;
      flags.add(key);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options[body] = next;
      flags.add(body);
      index += 1;
      continue;
    }

    options[body] = true;
    flags.add(body);
  }

  return { flags, options, argv };
}

export function hasFlag(flags, name) {
  return flags.has(name);
}

export function getOption(options, name, fallback = undefined) {
  return options[name] ?? fallback;
}

export function pass(label, message = '') {
  console.log(`${ANSI.green}PASS${ANSI.reset} ${label}${message ? ` — ${message}` : ''}`);
}

export function fail(label, message = '') {
  console.error(`${ANSI.red}FAIL${ANSI.reset} ${label}${message ? ` — ${message}` : ''}`);
}

export function warn(label, message = '') {
  console.warn(`${ANSI.yellow}WARN${ANSI.reset} ${label}${message ? ` — ${message}` : ''}`);
}

export function info(message) {
  console.log(`${ANSI.cyan}${message}${ANSI.reset}`);
}

export function dim(message) {
  console.log(`${ANSI.dim}${message}${ANSI.reset}`);
}

export function exitWithFailures(failures) {
  if (failures.length === 0) return;
  console.error('');
  for (const failure of failures) fail('check', failure);
  process.exit(1);
}
