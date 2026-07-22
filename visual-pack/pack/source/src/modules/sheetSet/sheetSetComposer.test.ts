import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeSheetSet } from '@/modules/sheetSet/sheetSetComposer';
import type { ProjectManifest } from '@/types';

describe('composeSheetSet', () => {
  it('produces title, plan, and elevation stub pages', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/sample-house-01.json');
    const manifest = JSON.parse(readFileSync(samplePath, 'utf8')) as ProjectManifest;
    const set = composeSheetSet(manifest);

    expect(set.pages.length).toBeGreaterThanOrEqual(3);
    expect(set.pages.some((p) => p.kind === 'title')).toBe(true);
    expect(set.pages.some((p) => p.kind === 'plan')).toBe(true);
    expect(set.pages.some((p) => p.kind === 'elevation')).toBe(true);
    expect(set.disclaimer).toContain('not for construction');
  });
});
