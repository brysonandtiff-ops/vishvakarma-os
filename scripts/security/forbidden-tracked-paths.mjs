/**
 * Block machine-local credentials and generated deployment state from Git.
 * The source-only checker uses this predicate against git ls-files.
 */
export function forbiddenTrackedPathReason(filename) {
  if (typeof filename !== 'string' || filename.length === 0) return null;
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  const segments = normalized.split('/').filter(Boolean);

  if (segments.some((segment) => ['.local', '.wrangler', '.vercel'].includes(segment))) {
    return 'machine-local authentication or deployment state';
  }
  if (segments.includes('dist')) return 'generated distribution output';
  if (segments.includes('.auth') && segments.includes('playwright')) {
    return 'Playwright authenticated browser state';
  }

  const leaf = segments.at(-1) ?? '';
  if (leaf.endsWith('.clixml')) return 'PowerShell encrypted machine-local credential';
  if (/^(?:storage[-_]state)(?:\.|$)/i.test(leaf)) return 'authenticated browser storage-state file';
  if (leaf === 'auth.json' && segments.includes('playwright')) {
    return 'Playwright authenticated browser state';
  }
  return null;
}
