import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

const projectsPageSource = read('src/pages/ProjectsPage.tsx');

describe('Projects demo samples', () => {
  it('keeps reviewer walkthrough fixtures local and wired to the editor', () => {
    expect(projectsPageSource).toContain('PROJECT_DEMO_SAMPLE_IDS');
    expect(projectsPageSource).toContain("'family-home-4br'");
    expect(projectsPageSource).toContain("'duplex-two-floor'");
    expect(projectsPageSource).toContain("'courtyard-villa-indian'");
    expect(projectsPageSource).toContain('buildSampleManifest(sampleId)');
    expect(projectsPageSource).toContain('loadManifest: manifest');
    expect(projectsPageSource).toContain('Demo fixtures are generated in-browser');
  });
});
