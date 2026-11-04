/**
 * Evidence scope for the signed-in Vishvakarma.OS browser save/reload proof.
 * A service-role API roundtrip is not a user's browser session or RLS proof.
 */
export const REQUIRED_BROWSER_SAVE_LOAD_CHECKS = Object.freeze([
  'browser: Google sign-in → /editor',
  'browser: sample loaded',
  'browser: cloud save toast',
  'browser: hard refresh',
  'browser: reload preserves counts',
  'browser: export JSON counts',
  'browser: import exported JSON counts',
]);

export function isVerifiedBrowserSaveLoadProof(receipt) {
  if (!receipt || typeof receipt !== 'object' || receipt.mode !== 'interactive' ||
      receipt.result !== 'PASS' || receipt.qualifies_as_release_browser_acceptance !== true) {
    return false;
  }
  if (!/^[0-9a-f]{40}$/.test(receipt.commitSha ?? '')) return false;
  try {
    if (new URL(receipt.deploymentUrl).protocol !== 'https:') return false;
  } catch {
    return false;
  }
  if (!Array.isArray(receipt.checks) || receipt.checks.some((item) =>
    !item || typeof item.name !== 'string' || item.pass !== true
  )) return false;
  return REQUIRED_BROWSER_SAVE_LOAD_CHECKS.every((name) =>
    receipt.checks.some((item) => item.name === name && item.pass === true)
  );
}
