import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'src');

const bannedProductionPatterns = [
  /SpookyFocusGuard/i,
  /playSpookyFocusChime/i,
  /rage[-_ ]?click/i,
  /three[- ]second pause/i,
  /3[- ]second pause/i,
  /reset your flow state/i,
  /vish-frustration-detected/i,
  /Shunya Reset/i,
  /Resetting Focus · Aligning Prana/i,
];

function collectProductionFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.relative(sourceRoot, absolutePath).replaceAll('\\', '/');

    if (
      relativePath.startsWith('test/') ||
      relativePath.includes('/__tests__/') ||
      relativePath.includes('/test/')
    ) {
      return [];
    }

    const stats = statSync(absolutePath);
    if (stats.isDirectory()) return collectProductionFiles(absolutePath);
    return /\.(?:ts|tsx|js|jsx)$/i.test(entry) ? [absolutePath] : [];
  });
}

describe('user autonomy release rule', () => {
  it('does not ship an active rage-click or impatience interruption path', () => {
    const violations = collectProductionFiles(sourceRoot).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      return bannedProductionPatterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${path.relative(repoRoot, filePath)} matched ${pattern}`);
    });

    const detector = readFileSync(
      path.join(sourceRoot, 'modules', 'telemetry', 'frustrationDetector.ts'),
      'utf8',
    );
    expect(detector).not.toMatch(/addEventListener|CustomEvent|pointermove|triggerFrustration|handleClick/);

    const overlay = readFileSync(
      path.join(sourceRoot, 'components', 'editor', 'ShunyaOverlay.tsx'),
      'utf8',
    );
    expect(overlay).not.toMatch(/fixed inset-0|setTimeout|playSolfeggioBell|Inhale|Exhale/);
    expect(violations).toEqual([]);
  });
});
