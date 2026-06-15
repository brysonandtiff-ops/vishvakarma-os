#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
  const raw = readFileSync(join(__dirname, 'auto-ship-config.json'), 'utf8');
  return JSON.parse(raw);
}

export function findGitRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  for (let depth = 0; depth < 20; depth += 1) {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

export function shouldSkipCommand(command, skipPatterns) {
  if (!command || typeof command !== 'string') return false;
  const normalized = command.trim();
  if (!normalized) return false;
  return skipPatterns.some((pattern) => new RegExp(pattern, 'i').test(normalized));
}

export function isExcludedPath(relativePath, excludePatterns) {
  const normalized = relativePath.replaceAll('\\', '/');
  return excludePatterns.some((pattern) => new RegExp(pattern, 'i').test(normalized));
}

export function extractPorcelainPath(line) {
  const trimmed = line.trimEnd();
  if (trimmed.length < 4 || trimmed[2] !== ' ') return null;
  const rawPath = trimmed.slice(3).trimStart();
  if (!rawPath) return null;
  return rawPath.includes(' -> ') ? rawPath.split(' -> ').pop()?.trim() ?? rawPath : rawPath;
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

export function shouldAcquireDebounceLock(lockPath, debounceMs, now = Date.now()) {
  if (!existsSync(lockPath)) return true;
  try {
    const raw = readFileSync(lockPath, 'utf8');
    const parsed = JSON.parse(raw);
    const ts = typeof parsed.timestamp === 'number' ? parsed.timestamp : 0;
    return now - ts >= debounceMs;
  } catch {
    return true;
  }
}
