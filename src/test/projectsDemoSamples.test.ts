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
});
