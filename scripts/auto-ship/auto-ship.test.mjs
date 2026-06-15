import { describe, expect, it } from 'vitest';
import {
  buildCommitMessage,
  filterStageablePaths,
  isExcludedPath,
  isMutatingTool,
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
