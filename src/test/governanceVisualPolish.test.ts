import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Governance visual polish', () => {
  it('wires the governance polish stylesheet through app startup', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-governance-polish.css');
  });

  it('keeps the shared governance page visual system targeted to existing surfaces', () => {
    const styles = read('src/styles/vish-governance-polish.css');

    expect(styles).toContain('.vish-workspace-shell .gov-page-header');
    expect(styles).toContain('ॐ शासन · प्रमाण · लेखा');
    expect(styles).toContain('.vish-workspace-shell .gov-page-header h1');
    expect(styles).toContain('.vish-workspace-shell .gov-page-header .tabular-nums');
    expect(styles).toContain(".vish-workspace-shell .gov-page-header ~ * [role='tab'][data-state='active']");
    expect(styles).toContain('.vish-workspace-shell .gov-page-header ~ * .border-dashed');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps the governance pages using the shared page header contract', () => {
    const pages = [
      'src/pages/SpecCenterPage.tsx',
      'src/pages/RegistryPage.tsx',
      'src/pages/ChangeRequestsPage.tsx',
      'src/pages/ReleasesPage.tsx',
      'src/pages/AuditLogPage.tsx',
    ];

    for (const page of pages) {
      const source = read(page);
      expect(source).toContain('gov-page-header');
      expect(source).toContain('AppLayout');
    }
  });

  it('keeps core governance route titles present for user orientation', () => {
    const spec = read('src/pages/SpecCenterPage.tsx');
    const registry = read('src/pages/RegistryPage.tsx');
    const changes = read('src/pages/ChangeRequestsPage.tsx');
    const releases = read('src/pages/ReleasesPage.tsx');
    const audit = read('src/pages/AuditLogPage.tsx');

    expect(spec).toContain('Spec Center');
    expect(registry).toContain('Registry Center');
    expect(changes).toContain('Change Requests');
    expect(releases).toContain('Release Center');
    expect(audit).toContain('Audit Log');
  });
});
