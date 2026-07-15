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

  it('keeps internal panels behind compile-time lazy boundaries', () => {
    const app = readRepoFile('src', 'App.tsx');
    const main = readRepoFile('src', 'main.tsx');
    const palette = readRepoFile('src', 'components', 'workspace', 'WorkspaceCommandPalette.tsx');
    const qaTools = readRepoFile('src', 'components', 'qa', 'QaTools.tsx');
    const viteConfig = readRepoFile('vite.config.ts');
    const viteEnv = readRepoFile('src', 'vite-env.d.ts');

    expect(app).toContain("lazy(() => import('@/components/qa/QaTools'))");
    expect(app).toContain('__VISH_QA_TOOLS_ENABLED__');
    expect(app).not.toContain("from '@/config/qaTools'");
    expect(palette).toContain('__VISH_QA_TOOLS_ENABLED__');
    expect(palette).toContain("import('@/qa-evidence/QaEvidencePanel')");
    expect(palette).toContain("import('@/touch-audit/IpadTouchAuditHud')");
    expect(palette).not.toContain("from '@/qa-evidence/QaEvidencePanel'");
    expect(palette).not.toContain("from '@/touch-audit/IpadTouchAuditHud'");
    expect(viteConfig).toContain('__VISH_QA_TOOLS_ENABLED__');
    expect(viteConfig).toContain("mode.startsWith('e2e')");
    expect(viteEnv).toContain('declare const __VISH_QA_TOOLS_ENABLED__: boolean');
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
