/**
 * Evidence scope for the signed-in Vishvakarma.OS browser save/reload proof.
 * A service-role API roundtrip is not a user's browser session or RLS proof.
 */
import { isTrustedCloudflareDeploymentProof } from './cloudflare-deployment-proof.mjs';

export const REQUIRED_BROWSER_SAVE_LOAD_CHECKS = Object.freeze([
  'browser: Google sign-in → /editor',
  'browser: deployment origin preserved',
  'browser: sample loaded',
  'browser: cloud save toast',
  'browser: hard refresh',
  'browser: reload preserves counts',
  'browser: export JSON counts',
  'browser: import target is empty',
  'browser: import exported JSON counts',
]);

export function isVerifiedBrowserSaveLoadProof(receipt, {
  requestedUrl, expectedCommitSha, deploymentProof,
} = {}) {
  if (!receipt || typeof receipt !== 'object' || receipt.mode !== 'interactive' ||
      receipt.result !== 'PASS' || receipt.qualifies_as_release_browser_acceptance !== true) {
    return false;
  }
  // A JSON receipt or a caller-supplied SHA cannot create trusted provenance.
  // The recorder and release gate must obtain fresh authenticated API proof.
  if (!isTrustedCloudflareDeploymentProof(deploymentProof, { requestedUrl, expectedCommitSha }) ||
      receipt.commitSha !== deploymentProof.commitSha ||
      receipt.deploymentUrl !== deploymentProof.deploymentUrl ||
      !receipt.deploymentProof ||
      Object.keys(deploymentProof).some((key) => receipt.deploymentProof[key] !== deploymentProof[key])) return false;
  if (!Array.isArray(receipt.checks) || receipt.checks.some((item) =>
    !item || typeof item.name !== 'string' || item.pass !== true
  )) return false;
  return REQUIRED_BROWSER_SAVE_LOAD_CHECKS.every((name) =>
    receipt.checks.some((item) => item.name === name && item.pass === true)
  );
}
