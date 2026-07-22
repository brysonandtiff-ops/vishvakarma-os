import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSheetSetPdfBytes } from '@/modules/sheetSet/sheetSetPdfExport';
import type { ProjectManifest } from '@/types';

describe('sheetSetPdfExport', () => {
  it('builds a multi-page PDF from composed sheet set', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/sample-house-01.json');
    const manifest = JSON.parse(readFileSync(samplePath, 'utf8')) as ProjectManifest;
    const bytes = buildSheetSetPdfBytes(manifest);
    const text = new TextDecoder().decode(bytes);

    expect(bytes.length).toBeGreaterThan(200);
    expect(text).toContain('%PDF-1.4');
    expect(text).toContain('A-001');
    expect(text).toContain('A-101');
    expect(text).toContain('not for construction');
  });
});
