import { describe, expect, it } from 'vitest';
import {
  HISTORICAL_FORBIDDEN_PATH_REGEXES,
  getSyntheticHistoryFilterArgs,
  isHistoricalPurgePath,
  runSyntheticHistoryPurgeRehearsal,
} from './history-path-purge-rehearsal.mjs';

describe('S.I.R.E. LAW 105 Ω — history purge is synthetic-only', () => {
  it.each([
    '.local/session.txt',
    'nested/.local/test.json',
    '.wrangler/state/runtime.db',
    'server/.vercel/project.json',
    'dist/games/engine.js',
    'packages/editor/dist/output.js',
    'PowerShell/state.clixml',
    'scripts/STATE.CLIXML',
    'e2e/storage-state.json',
    'e2e/storage_state.json',
    'playwright/.auth/account.json',
    'tools/playwright/auth.json',
    'TOOLS\\PLAYWRIGHT\\.AUTH\\user.json',
  ])('selects forbidden historical file %s', (path) => {
    expect(isHistoricalPurgePath(path)).toBe(true);
  });

  it.each([
    'src/editor/EditorPage.tsx',
    'docs/security/incident.md',
    'scripts/security/history-backup-preflight.mjs',
    'docs/dist-information.md',
    '.env.example',
    'playwright.config.ts',
    'tests/auth.json',
    'public/images/sky.png',
  ])('retains normal non-secret source %s', (path) => {
    expect(isHistoricalPurgePath(path)).toBe(false);
  });

  it('exports only invert-path filters and never remote push or a real checkout rewrite mode', () => {
    const args = getSyntheticHistoryFilterArgs();
    expect(args.slice(0, 2)).toEqual(['--force', '--invert-paths']);
    expect(args.filter((s) => s === '--path-regex')).toHaveLength(HISTORICAL_FORBIDDEN_PATH_REGEXES.length);
    expect(args).not.toContain('--prune-empty');
    expect(args).not.toContain('--replace-text');
    expect(args.join(' ')).not.toMatch(/\bpush\b|--refs|--sensitive-data-removal/);
  });

  it('refuses an absent external filter tool rather than touching the current checkout', () => {
    expect(() => runSyntheticHistoryPurgeRehearsal('')).toThrow(/specific installed/);
    expect(() => runSyntheticHistoryPurgeRehearsal()).toThrow(/specific installed/);
  });
});
