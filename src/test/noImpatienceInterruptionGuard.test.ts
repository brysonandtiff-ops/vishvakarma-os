import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'src');

const bannedProductionPatterns = [
  /SpookyFocusGuard/i,
  /playSpookyFocusChime/i,
  /rage[-_ ]?click/i,
  /frustration[-_ ]?(guard|detector|overlay)/i,
  /three[- ]second pause/i,
  /3[- ]second pause/i,
  /reset your flow state/i,
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
  it('does not ship a rage-click or impatience-triggered interruption screen', () => {
    const violations = collectProductionFiles(sourceRoot).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      return bannedProductionPatterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${path.relative(repoRoot, filePath)} matched ${pattern}`);
    });

    expect(violations).toEqual([]);
  });
});
