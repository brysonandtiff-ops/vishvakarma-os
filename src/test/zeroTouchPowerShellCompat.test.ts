import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('zero-touch PowerShell compatibility gate', () => {
  it('routes the everything launcher through the parsed compatibility controller', () => {
    const everything = read('RUN_VISH_EVERYTHING.ps1');

    expect(everything).toContain('RUN_VISH_ZERO_TOUCH_COMPAT.ps1');
    expect(everything).not.toContain(
      '$Cutover = Join-Path $RepoRoot "RUN_VISH_ZERO_TOUCH_CUTOVER.ps1"',
    );
    expect(everything).toContain('Parsed Cloudflare zero-touch cutover');
  });

  it('repairs both invalid colon interpolations before execution', () => {
    const compat = read('RUN_VISH_ZERO_TOUCH_COMPAT.ps1');

    expect(compat).toContain('Write-Host "${Status}: $Name - $Detail"');
    expect(compat).toContain(
      'Merge PR #${PullRequestNumber}: Cloudflare Pages and Workers migration',
    );
    expect(compat).toContain('Write-Host "$Status: $Name - $Detail"');
    expect(compat).toContain(
      'Merge PR #$PullRequestNumber: Cloudflare Pages and Workers migration',
    );
  });

  it('parses the complete patched script and normalizes all generated dist output', () => {
    const compat = read('RUN_VISH_ZERO_TOUCH_COMPAT.ps1');

    expect(compat).toContain(
      '[System.Management.Automation.Language.Parser]::ParseFile',
    );
    expect(compat).toContain('if (@($ParseErrors).Count -gt 0)');
    expect(compat).toContain(`'"dist/build-meta.json",' = '"dist",'`);
    expect(compat).toContain('Normalize-GeneratedEvidence');
    expect(compat).toContain('before changing branches');
  });

  it('executes the patched script from an ignored local path with the real repo root', () => {
    const compat = read('RUN_VISH_ZERO_TOUCH_COMPAT.ps1');

    expect(compat).toContain('.local\\cloudflare-proof\\zero-touch-compat');
    expect(compat).toContain('VISH_ZERO_TOUCH_REPO_ROOT');
    expect(compat).toContain('& $PatchedPath @PSBoundParameters');
  });
});
