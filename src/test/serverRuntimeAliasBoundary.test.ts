import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const apiReachableSourceFiles = [
  'src/ai/building-designer/generators/requirementsExtractor.ts',
  'src/services/lot-analysis/lotAnalysis.ts',
  'src/services/copilot/ingestion/documentParsers.ts',
  'src/config/billingPlans.ts',
];

describe('server runtime source graph', () => {
  it('uses Node-resolvable relative imports in API-reachable source modules', () => {
    for (const path of apiReachableSourceFiles) {
      const source = read(path);
      expect(source, path).not.toContain("from '@/");
      expect(source, path).not.toContain("import('@/");
    }
  });

  it('keeps billing server imports free of browser-only import.meta evaluation', () => {
    const billingPlans = read('src/config/billingPlans.ts');
    const exportFormats = read('src/config/exportFormats.ts');

    expect(billingPlans).toContain("from './exportFormats'");
    expect(billingPlans).not.toContain('marketingFeatures');
    expect(billingPlans).not.toContain('import.meta');
    expect(exportFormats).not.toContain('import.meta');
  });
});
