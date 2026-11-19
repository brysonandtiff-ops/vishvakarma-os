/**
 * Release certification preflight — live, fail-closed issue status.
 * Independent release approval also requires verified evidence for both holds.
 * Do not read or log private backup artifacts or credentials.
 */
const ISSUE_API = 'https://api.github.com/repos/brysonandtiff-ops/vishvakarma-os/issues';
export const SECURITY_INCIDENT_URL = `${ISSUE_API}/153`;
export const RECOVERY_BACKUP_URL = `${ISSUE_API}/188`;

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
  const isCanonical = host === 'vishvakarmaos.app' || host === 'www.vishvakarmaos.app';
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

function requireClosedIssue(issue, number, name) {
  if (
    !issue || issue.number !== number || issue.state !== 'closed' ||
    typeof issue.closed_at !== 'string' ||
    !Number.isFinite(Date.parse(issue.closed_at)) ||
    issue.pull_request
  ) {
    throw new Error(`${name} #${number} is open or lacks verified closure. Release blocked.`);
  }
  return true;
}

export function requireClosedSecurityIncident(issue) {
  return requireClosedIssue(issue, 153, 'Security issue');
}

async function fetchReleaseIssue(url, label, fetchFn) {
  let response;
  try {
    response = await fetchFn(url, {
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
    throw new Error(`Could not verify ${label} from GitHub. Release blocked.`);
  }

  if (!response || response.status !== 200 || typeof response.json !== 'function') {
    throw new Error(`${label} state unavailable from GitHub. Release blocked.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${label} response invalid. Release blocked.`);
  }
}

export async function requireReleaseSecurityPreflight(liveUrl, fetchFn = fetch) {
  const origin = validateReleaseUrl(liveUrl);
  requireClosedSecurityIncident(await fetchReleaseIssue(SECURITY_INCIDENT_URL, 'Security issue #153', fetchFn));
  requireClosedIssue(
    await fetchReleaseIssue(RECOVERY_BACKUP_URL, 'Recovery backup #188', fetchFn),
    188,
    'Recovery backup',
  );

  // Strict gates and independent acceptance follow this preflight.
  return origin;
}
