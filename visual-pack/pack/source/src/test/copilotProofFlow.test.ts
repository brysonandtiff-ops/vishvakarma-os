import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

const resultsPanelSource = read('src/components/editor/ai-designer/AIDesignerResultsPanel.tsx');

describe('AI Copilot proof flow', () => {
  it('keeps the reviewer proof story visible in the deliverables view', () => {
    expect(resultsPanelSource).toContain('CopilotProofFlow');
    expect(resultsPanelSource).toContain('generated concept');
    expect(resultsPanelSource).toContain('cost estimate');
    expect(resultsPanelSource).toContain('compliance notes');
    expect(resultsPanelSource).toContain('export preview');
    expect(resultsPanelSource).toContain('AUD $');
    expect(resultsPanelSource).toContain('decision-support only');
  });
});
