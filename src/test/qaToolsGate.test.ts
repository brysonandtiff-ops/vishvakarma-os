import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { areQaToolsEnabled } from '@/config/qaTools';

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('QA tooling boundary', () => {
  it('is disabled by default in production', () => {
    expect(
      areQaToolsEnabled({ DEV: false, MODE: 'production', VITE_ENABLE_QA_TOOLS: undefined }),
    ).toBe(false);
  });

  it('is enabled only for development, E2E, or an explicit flag', () => {
    expect(areQaToolsEnabled({ DEV: true, MODE: 'development', VITE_ENABLE_QA_TOOLS: undefined })).toBe(true);
    expect(areQaToolsEnabled({ DEV: false, MODE: 'e2e-local', VITE_ENABLE_QA_TOOLS: undefined })).toBe(true);
    expect(areQaToolsEnabled({ DEV: false, MODE: 'production', VITE_ENABLE_QA_TOOLS: 'true' })).toBe(true);
  });

  it('keeps internal panels behind a lazy boundary rather than the production entrypoint', () => {
    const app = readRepoFile('src', 'App.tsx');
    const main = readRepoFile('src', 'main.tsx');
    const qaTools = readRepoFile('src', 'components', 'qa', 'QaTools.tsx');

    expect(app).toContain("lazy(() => import('@/components/qa/QaTools'))");
    expect(app).toContain('QA_TOOLS_ENABLED');
    expect(main).not.toContain('DeviceValidationPanel');
    expect(main).not.toContain('vish-device-validation.css');
    expect(main).not.toContain('vish-qa-evidence.css');
    expect(main).not.toContain('vish-touch-audit-hud.css');
    expect(qaTools).toContain('<DeviceValidationPanel />');
    expect(qaTools).toContain('<QaEvidencePanel />');
    expect(qaTools).toContain('<IpadTouchAuditHud />');
  });

  it('enables QA tooling in E2E builds that exercise proof panels', () => {
    const e2eBuilder = readRepoFile('scripts', 'build-e2e-local.mjs');
    expect(e2eBuilder).toContain('VITE_ENABLE_QA_TOOLS: "true"');
  });
});
