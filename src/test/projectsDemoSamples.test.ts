import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  // Regression: the dashboard's primary actions were rendered without handlers,
  // so "Open Project", "Import Files" and "AI Copilot" were dead controls.
  it('wires every dashboard primary action to an editor intent', () => {
    for (const testId of ['dashboard-open-project', 'dashboard-import-files', 'dashboard-ai-copilot']) {
      expect(projectsPageSource).toContain(`data-testid="${testId}"`);
    }
    for (const intent of ['openIntent: \'openProject\'', 'openIntent: \'import\'', 'openIntent: \'aiDesigner\'']) {
      expect(projectsPageSource).toContain(intent);
    }
    // The editor must honour every intent the dashboard can send.
    const editorSource = read('src/pages/EditorPage.tsx');
    expect(editorSource).toContain("state.openIntent === 'openProject'");
    expect(editorSource).toContain("state.openIntent === 'import'");
    expect(editorSource).toContain("state.openIntent === 'aiDesigner'");
  });

  // Regression: demoSamples/openDemoSample were computed but never rendered.
  it('renders the demo sample fixtures it computes', () => {
    expect(projectsPageSource).toContain('demoSamples.map');
    expect(projectsPageSource).toContain('openDemoSample(sample.id)');
  });
});
