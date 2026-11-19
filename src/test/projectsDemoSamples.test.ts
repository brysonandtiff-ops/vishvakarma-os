import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { resolveSampleManifestSync } from '@/core/sampleCatalog';
import { openManifestInEditor, type EditorManifestView } from '@/editor/openManifestInEditor';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

const projectsPageSource = read('src/pages/ProjectsPage.tsx');
const sampleCatalogSource = read('src/core/sampleCatalog.ts');

describe('Projects demo samples', () => {
  it('keeps reviewer walkthrough fixtures local and wired to the editor', () => {
    expect(projectsPageSource).toContain("getSamplesForSurface('projects-demo')");
    expect(projectsPageSource).toContain('resolveSampleManifestSync(sampleId)');
    expect(projectsPageSource).toContain('openManifestInEditor');
    expect(projectsPageSource).toContain('data-testid={`projects-demo-${sample.id}`}');
    expect(projectsPageSource).toContain('Demo fixtures are generated in-browser');

    for (const id of ['family-home-4br', 'duplex-two-floor', 'courtyard-villa-indian']) {
      expect(sampleCatalogSource).toContain(`id: '${id}'`);
      expect(sampleCatalogSource).toContain("'projects-demo'");
    }
  });

  it('wires dashboard shortcuts to their corresponding editor dialogs', () => {
    const editorSource = read('src/pages/EditorPage.tsx');
    for (const [testId, intent] of [
      ['dashboard-open-project', 'openProject'],
      ['dashboard-import-files', 'import'],
      ['dashboard-ai-copilot', 'aiDesigner'],
    ] as const) {
      expect(projectsPageSource).toContain(`data-testid="${testId}"`);
      expect(projectsPageSource).toContain(`openIntent: '${intent}'`);
      expect(editorSource).toContain(`state.openIntent === '${intent}'`);
    }
    expect(projectsPageSource).toContain("openIntent: 'newProject'");
    expect(editorSource).toContain("state.openIntent === 'newProject'");
  });

  it.each<[EditorManifestView | undefined, string]>([
    [undefined, '/editor'],
    ['orbit', '/editor?view=orbit'],
    ['walk', '/editor?view=walk'],
  ])('hands the same sample to Studio for view %s', (view, path) => {
    const manifest = resolveSampleManifestSync('six-three-atrium-wing');
    const navigate = vi.fn();

    openManifestInEditor(navigate, manifest, { source: 'sample', view });

    expect(navigate).toHaveBeenCalledWith(path, {
      state: { loadManifest: manifest, projectName: manifest.name, manifestSource: 'sample' },
    });
  });
});
