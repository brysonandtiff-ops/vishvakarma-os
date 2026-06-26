import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Solar Mandala visual identity', () => {
  it('registers visual theme options without changing the default theme', () => {
    const config = read('src/config/visualThemes.ts');

    expect(config).toContain("DEFAULT_VISUAL_THEME: VisualThemeId = 'midnight-obsidian'");
    expect(config).toContain("id: 'solar-mandala'");
    expect(config).toContain('Alternate presentation-only visual identity');
    expect(config).toContain('isVisualThemeId');
  });

  it('loads the Solar Mandala stylesheet after existing theme layers', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-editor-polish.css');
    expect(main).toContain('./styles/vish-theme-solar-mandala.css');
    expect(main.indexOf('./styles/vish-theme-solar-mandala.css')).toBeGreaterThan(
      main.indexOf('./styles/vish-editor-polish.css'),
    );
  });

  it('mounts a non-schema visual identity controller in the app shell', () => {
    const app = read('src/App.tsx');
    const controller = read('src/components/common/VisualThemeController.tsx');

    expect(app).toContain('VisualThemeController');
    expect(controller).toContain('VISUAL_THEME_STORAGE_KEY');
    expect(controller).toContain('data-testid="visual-theme-controller"');
    expect(controller).toContain('document.documentElement.dataset.visualTheme');
    expect(controller).not.toContain('supabase');
    expect(controller).not.toContain('stripe');
  });

  it('keeps the controller below modal overlay z-index and scoped to visual CSS only', () => {
    const styles = read('src/styles/vish-theme-solar-mandala.css');

    expect(styles).toContain('z-index: 40');
    expect(styles).not.toContain('z-index: 80');
    expect(styles).toContain("data-visual-theme='solar-mandala'");
    expect(styles).toContain('Egyptian monument geometry + Indian mandala light');
    expect(styles).toContain('--vish-solar-lapis');
    expect(styles).toContain('--vish-solar-nile');
    expect(styles).toContain('--vish-solar-saffron');
    expect(styles).toContain('.vish-auth-gate');
    expect(styles).toContain('.vish-marketing-page');
    expect(styles).toContain('.vish-workspace-shell');
    expect(styles).not.toContain('localStorage.setItem');
    expect(styles).not.toContain('createProject');
  });
});
