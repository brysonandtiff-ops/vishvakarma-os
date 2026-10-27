/**
 * S.I.R.E. LAW 105 Ω: a service-role database roundtrip is never proof that
 * a real approved user authenticated, saved, reopened or exported a project.
 */
export const REQUIRED_CLOUD_BROWSER_CHECKS = Object.freeze([
  'browser: Google sign-in → /editor',
  'browser: sample loaded',
  'browser: cloud save toast',
  'browser: reload preserves counts',
  'browser: export JSON counts',
]);

export function validateCloudSaveEvidence(evidence, exactSha) {
  const failures = [];
  if (!evidence || typeof evidence !== 'object') return ['Missing cloud save evidence receipt'];
  if (evidence.mode !== 'interactive') failures.push('Only authenticated interactive-browser evidence may certify cloud save/reload');
  if (evidence.result !== 'PASS') failures.push('Cloud save/reload evidence is not PASS');
  if (evidence.certified !== true) failures.push('Cloud save/reload receipt has not been explicitly certified');
  if (!/^[0-9a-f]{40}$/.test(String(exactSha ?? '')) || evidence.commitSha !== exactSha) {
    failures.push('Cloud save/reload receipt must match the current exact 40-character Git commit SHA');
  }
  if (!Array.isArray(evidence.checks)) return [...failures, 'Evidence checks must be an array'];
  for (const name of REQUIRED_CLOUD_BROWSER_CHECKS) {
    const matches = evidence.checks.filter((item) => item && item.name === name);
    if (matches.length !== 1 || matches[0].pass !== true) {
      failures.push(`Required authenticated browser check not proven exactly once: ${name}`);
    }
  }
  return failures;
}
