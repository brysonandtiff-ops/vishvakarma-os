import { describe, expect, it } from 'vitest';
import {
  buildCommitMessage,
  extractPorcelainPath,
  filterStageablePaths,
  isDirectEntry,
  isExcludedPath,
  isMutatingTool,
  normalizeRepoPath,
  parseShellExitCode,
  readDebounceLockTimestamp,
  shouldAcquireDebounceLock,
  shouldSkipCommand,
} from './auto-ship-lib.mjs';

const excludePatterns = [
  '^\\.env',
  '^migration/export-.*\\.json$',
  '^\\.cursor/auto-ship/',
  '^node_modules/',
];

const skipPatterns = ['auto-ship', 'git\\s+(commit|push)'];

describe('auto-ship-lib', () => {
  it('skips recursive git and auto-ship commands', () => {
    expect(shouldSkipCommand('git commit -m test', skipPatterns)).toBe(true);
    expect(shouldSkipCommand('pnpm run auto-ship', skipPatterns)).toBe(true);
    expect(shouldSkipCommand('pnpm run lint:types', skipPatterns)).toBe(false);
  });

  it('excludes secret and generated paths', () => {
    expect(isExcludedPath('.env.local', excludePatterns)).toBe(true);
    expect(isExcludedPath('migration/export-foo.json', excludePatterns)).toBe(true);
    expect(isExcludedPath('src/pages/EditorPage.tsx', excludePatterns)).toBe(false);
  });

  it('filters stageable paths from porcelain', () => {
    const paths = filterStageablePaths(
      [' M src/pages/EditorPage.tsx', '?? .env.local', '?? src/cast/types.ts'],
      excludePatterns,
    );
    expect(paths).toEqual(['src/pages/EditorPage.tsx', 'src/cast/types.ts']);
  });

  it('parses porcelain paths when the first status column is a leading space', () => {
    expect(extractPorcelainPath(' M docs/design/page.png')).toBe('docs/design/page.png');
    expect(extractPorcelainPath('M docs/design/page.png')).toBeNull();
  });

  it('normalizes Windows paths and quoted porcelain entries', () => {
    expect(normalizeRepoPath('src\\pages\\EditorPage.tsx')).toBe('src/pages/EditorPage.tsx');
    expect(extractPorcelainPath('?? "docs/foo bar.md"')).toBe('docs/foo bar.md');
    expect(
      filterStageablePaths(['?? src\\cast\\types.ts'], excludePatterns),
    ).toEqual(['src/cast/types.ts']);
  });

  it('detects direct entry on Windows paths', () => {
    const moduleUrl = new URL('file:///C:/repo/scripts/auto-ship/auto-ship.mjs');
    expect(isDirectEntry(moduleUrl, 'C:\\repo\\scripts\\auto-ship\\auto-ship.mjs')).toBe(true);
    expect(isDirectEntry(moduleUrl, 'C:\\repo\\scripts\\other.mjs')).toBe(false);
  });

  it('builds commit messages with trigger and file summary', () => {
    expect(buildCommitMessage('shell', ['src/a.ts', 'src/b.ts'])).toContain('after shell');
  });

  it('detects mutating tools only', () => {
    expect(isMutatingTool('Shell')).toBe(true);
    expect(isMutatingTool('Write')).toBe(true);
    expect(isMutatingTool('StrReplace')).toBe(true);
    expect(isMutatingTool('Read')).toBe(false);
    expect(isMutatingTool('Grep')).toBe(false);
  });

  it('respects debounce lock ttl when lock file is absent', () => {
    expect(shouldAcquireDebounceLock('/missing/lock/file', 10_000, 20_000)).toBe(true);
  });
});
