import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectsPageSource = readFileSync(new URL('../pages/ProjectsPage.tsx', import.meta.url), 'utf8');

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
