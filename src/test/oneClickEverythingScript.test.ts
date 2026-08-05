import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(
  join(process.cwd(), 'RUN_VISH_ONE_CLICK.ps1'),
  'utf8',
);

describe('Vishvakarma.OS true one-click controller', () => {
  it('archives and normalizes every generated output family', () => {
    for (const phrase of [
      '"dist"',
      '"docs/release/evidence"',
      '"evidence"',
      '"supabase/.temp"',
      '"public/build-meta.json"',
      '"coverage"',
      '"playwright-report"',
      '"test-results"',
      '".wrangler"',
      'one-click-generated-archive',
      'git restore --staged --worktree',
      'git clean -fd',
    ]) {
      expect(script).toContain(phrase);
    }
  });

  it('continues to fail closed on real source changes', () => {
    expect(script).toContain('Real source changes remain and were protected');
    expect(script).toContain('-not $Line.StartsWith("?? .local/")');
    expect(script).not.toContain('git reset --hard');
    expect(script).not.toContain('git clean -fdx');
  });

  it('synchronizes the exact branch and launches the complete controller', () => {
    for (const phrase of [
      'git fetch origin $Branch',
      'git switch $Branch',
      'git merge --ff-only "origin/$Branch"',
      'RUN_VISH_EVERYTHING.ps1',
      'DeleteVercelProject = $DeleteVercelProject',
      'VISHVAKARMA.OS TRUE ONE-CLICK AUTOPILOT: PASS',
    ]) {
      expect(script).toContain(phrase);
    }
  });
});
