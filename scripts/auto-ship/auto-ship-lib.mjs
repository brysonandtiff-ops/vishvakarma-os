#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
  const raw = readFileSync(join(__dirname, 'auto-ship-config.json'), 'utf8');
  return JSON.parse(raw);
}

export function findGitRoot(startDir = process.cwd(), maxDepth = 20) {
  let current = resolve(startDir);
  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/** Prefer the repo that owns project hooks (nested workspace safe). */
export function resolveRepoRootFromHook(hookDir, cwd = process.cwd()) {
  const fromHook = findGitRoot(hookDir, 8);
  if (fromHook) return fromHook;
  return findGitRoot(cwd);
}

export function parseShellExitCode(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

export function shouldSkipCommand(command, skipPatterns) {
  if (!command || typeof command !== 'string') return false;
  const normalized = command.trim();
  if (!normalized) return false;
  return skipPatterns.some((pattern) => new RegExp(pattern, 'i').test(normalized));
}

export function normalizeRepoPath(relativePath) {
  const unquoted =
    relativePath.length >= 2 &&
    relativePath.startsWith('"') &&
    relativePath.endsWith('"')
      ? relativePath.slice(1, -1)
      : relativePath;
  return unquoted.replaceAll('\\', '/');
}

export function isExcludedPath(relativePath, excludePatterns) {
  const normalized = normalizeRepoPath(relativePath);
  return excludePatterns.some((pattern) => new RegExp(pattern, 'i').test(normalized));
}

export function extractPorcelainPath(line) {
  const trimmed = line.trimEnd();
  if (trimmed.length < 4 || trimmed[2] !== ' ') return null;
  const rawPath = trimmed.slice(3).trimStart();
  if (!rawPath) return null;
  const pathPart = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop()?.trim() ?? rawPath : rawPath;
  return normalizeRepoPath(pathPart);
}

export function filterStageablePaths(porcelainLines, excludePatterns) {
  const paths = [];
  for (const line of porcelainLines) {
    const filePath = extractPorcelainPath(line);
    if (!filePath || isExcludedPath(filePath, excludePatterns)) continue;
    paths.push(filePath);
  }
  return paths;
}

export function parsePorcelain(stdout) {
  return stdout
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

export function buildCommitMessage(trigger, paths) {
  const unique = [...new Set(paths)].slice(0, 8);
  const summary =
    unique.length === 0
      ? 'workspace sync'
      : unique.length <= 3
        ? unique.join(', ')
        : `${unique.slice(0, 3).join(', ')} +${unique.length - 3} more`;
  return `chore(auto-ship): sync after ${trigger} [${summary}]`;
}

export function isMutatingTool(toolName) {
  if (!toolName || typeof toolName !== 'string') return false;
  const name = toolName.toLowerCase();
  return (
    name === 'shell' ||
    name.includes('write') ||
    name.includes('strreplace') ||
    name.includes('delete') ||
    name.includes('editnotebook') ||
    name.includes('applypatch') ||
    name.includes('apply_patch')
  );
}

export function isDirectEntry(moduleUrl, entryScript) {
  if (!entryScript || typeof entryScript !== 'string') return false;
  try {
    const modulePath = fileURLToPath(moduleUrl);
    const entryPath = resolve(entryScript);
    if (process.platform === 'win32') {
      return modulePath.toLowerCase() === entryPath.toLowerCase();
    }
    return modulePath === entryPath;
  } catch {
    return false;
  }
}

export function readDebounceLockTimestamp(lockPath) {
  if (!existsSync(lockPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
    return typeof parsed.timestamp === 'number' ? parsed.timestamp : null;
  } catch {
    return null;
  }
}

export function shouldAcquireDebounceLock(lockPath, debounceMs, now = Date.now()) {
  const ts = readDebounceLockTimestamp(lockPath);
  if (ts === null) return true;
  return now - ts >= debounceMs;
}

/** Re-check debounce and write the lock atomically before lint/commit. */
export function acquireDebounceLock(lockPath, debounceMs, now = Date.now()) {
  const ts = readDebounceLockTimestamp(lockPath);
  if (ts !== null && now - ts < debounceMs) return false;
  mkdirSync(dirname(lockPath), { recursive: true });
  writeFileSync(lockPath, `${JSON.stringify({ timestamp: now })}\n`, 'utf8');
  return true;
}
