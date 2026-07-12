import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

const routeSpecificImports = [
  'vish-marketing.css',
  'vish-auth-gate.css',
  'vish-workspace-shell.css',
  'vish-editor-chrome.css',
  'ipad-workspace.css',
  'vish-editor-3d-polish.css',
];

describe('route CSS boundaries', () => {
  it('keeps route-specific CSS out of the application entrypoint', () => {
    const main = readRepoFile('src', 'main.tsx');
    for (const stylesheet of routeSpecificImports) {
      expect(main).not.toContain(stylesheet);
    }
  });

  it('loads style families alongside their lazy route modules', () => {
    const routes = readRepoFile('src', 'AppRoutes.tsx');

    expect(routes).toContain("import('@/styles/entries/marketing')");
    expect(routes).toContain("import('@/styles/entries/auth')");
    expect(routes).toContain("import('@/styles/entries/workspace')");
    expect(routes).toContain("import('@/styles/entries/editor')");
    expect(routes).toContain('lazyStyledPage');
  });

  it('keeps each style family explicit and independently reviewable', () => {
    const marketing = readRepoFile('src', 'styles', 'entries', 'marketing.ts');
    const auth = readRepoFile('src', 'styles', 'entries', 'auth.ts');
    const workspace = readRepoFile('src', 'styles', 'entries', 'workspace.ts');
    const editor = readRepoFile('src', 'styles', 'entries', 'editor.ts');

    expect(marketing).toContain("import '../vish-marketing.css'");
    expect(auth).toContain("import '../vish-auth-gate.css'");
    expect(workspace).toContain("import '../vish-workspace-shell.css'");
    expect(editor).toContain("import '../vish-editor-chrome.css'");
    expect(editor).toContain("import '../../ipad-workspace.css'");
  });
});
