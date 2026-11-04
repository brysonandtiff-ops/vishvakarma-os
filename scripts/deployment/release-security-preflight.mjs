/**
 * Release certification preflight — live, fail-closed security issue status.
 * A closed incident is NECESSARY, not sufficient, for independent approval.
 * Do not read or log private backup artifacts or credentials.
 */
export const SECURITY_INCIDENT_URL =
  'https://api.github.com/repos/brysonandtiff-ops/vishvakarma-os/issues/153';

export function validateReleaseUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('A specific Cloudflare HTTPS deployment URL is required.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Release target is not a valid URL.');
  }

  const host = parsed.hostname.toLowerCase();
  const isCanonical = host === 'vishvakarma-os.app' || host === 'www.vishvakarma-os.app';
  const isPages = host === 'vishvakarma-os.pages.dev' ||
    /^[a-z0-9-]+\.vishvakarma-os\.pages\.dev$/.test(host);

  if (
    parsed.protocol !== 'https:' ||
    !isCanonical && !isPages ||
    parsed.username || parsed.password ||
    parsed.search || parsed.hash ||
    (parsed.pathname !== '/' && parsed.pathname !== '')
  ) {
    throw new Error('Release target must be a clean HTTPS Vishvakarma.OS Cloudflare origin.');
  }

  return parsed.origin;
}

export function requireClosedSecurityIncident(issue) {
  if (
    !issue || issue.number !== 153 || issue.state !== 'closed' ||
    typeof issue.closed_at !== 'string' ||
    !Number.isFinite(Date.parse(issue.closed_at)) ||
    issue.pull_request
  ) {
    throw new Error('P0 security issue #153 is open, unverified, or not a closed issue.');
  }
  return true;
}

export async function requireReleaseSecurityPreflight(liveUrl, fetchFn = fetch) {
  const origin = validateReleaseUrl(liveUrl);

  let response;
  try {
    response = await fetchFn(SECURITY_INCIDENT_URL, {
      method: 'GET',
      redirect: 'error',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'vishvakarma-security-preflight',
      },
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Could not verify incident #153 from GitHub. Release blocked.');
  }

  if (!response || response.status !== 200 || typeof response.json !== 'function') {
    throw new Error('Security incident state unavailable from GitHub. Release blocked.');
  }

  let issue;
  try {
    issue = await response.json();
  } catch {
    throw new Error('Security incident response invalid. Release blocked.');
  }

  requireClosedSecurityIncident(issue);

  // Closing an issue does not itself certify backups, rotations, hardware,
  // RLS isolation or independent approval; strict gates follow this preflight.
  return origin;
}
