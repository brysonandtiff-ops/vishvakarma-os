/**
 * Read-only source attestation for one immutable Pages deployment.
 * Cloudflare's deployment response contains build environment values. Never
 * persist the raw response or propagate its errors; retain this safe projection.
 */
const PROJECT = 'vishvakarma-os';
const trustedProofs = new WeakSet();
const SHA = /^[0-9a-f]{40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_RESPONSE_BYTES = 1_048_576;

export function requireImmutableCloudflareOrigin(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Deployment proof requires a clean immutable Cloudflare Pages preview origin.');
  }
  if (typeof rawUrl !== 'string' ||
      (rawUrl !== url.origin && rawUrl !== `${url.origin}/`) ||
      url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.search || url.hash || url.pathname !== '/' ||
      !/^[0-9a-f]{8}\.vishvakarma-os\.pages\.dev$/.test(url.hostname)) {
    throw new Error('Deployment proof requires https://<8-hex-deployment>.vishvakarma-os.pages.dev; canonical and branch aliases are not yet attested.');
  }
  return url.origin;
}

async function readBoundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response stream.');
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('Response too large.');
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    reader.releaseLock();
  }
}

export async function attestCloudflareDeployment({
  requestedUrl,
  expectedCommitSha,
  env = process.env,
  fetchFn = fetch,
}) {
  const deploymentUrl = requireImmutableCloudflareOrigin(requestedUrl);
  if (!SHA.test(expectedCommitSha ?? '')) {
    throw new Error('Deployment proof requires the full local Git commit SHA.');
  }
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const deploymentId = env.CLOUDFLARE_DEPLOYMENT_ID;
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!/^[0-9a-f]{32}$/.test(accountId ?? '') || !UUID.test(deploymentId ?? '') ||
      typeof token !== 'string' || !token || /\s/.test(token)) {
    throw new Error('Authenticated deployment proof requires valid CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DEPLOYMENT_ID and env-provided CLOUDFLARE_API_TOKEN (Pages Read).');
  }

  let payload;
  try {
    const response = await fetchFn(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${PROJECT}/deployments/${deploymentId}`,
      {
        method: 'GET',
        redirect: 'error',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (response?.status !== 200) throw new Error('API unavailable.');
    payload = await readBoundedJson(response);
  } catch {
    throw new Error('Cloudflare deployment metadata is unavailable or invalid; browser release proof is held.');
  }

  const deployment = payload?.result;
  const trigger = deployment?.deployment_trigger;
  if (payload?.success !== true || !Array.isArray(payload.errors) || payload.errors.length ||
      deployment?.project_name !== PROJECT || deployment.id !== deploymentId ||
      deployment.short_id !== deploymentId.slice(0, 8) ||
      deployment.url !== deploymentUrl ||
      deploymentUrl !== `https://${deployment.short_id}.${PROJECT}.pages.dev` ||
      !['preview', 'production'].includes(deployment.environment) ||
      deployment.is_skipped !== false || deployment.latest_stage?.name !== 'deploy' ||
      deployment.latest_stage?.status !== 'success' ||
      !['github', 'gitlab'].includes(deployment.source?.type) ||
      !['github:push', 'deploy_hook'].includes(trigger?.type) ||
      trigger?.metadata?.commit_dirty !== false ||
      !SHA.test(trigger?.metadata?.commit_hash ?? '') ||
      trigger.metadata.commit_hash !== expectedCommitSha) {
    throw new Error('Cloudflare metadata does not attest this successful, clean Git deployment at the requested origin and exact local source SHA.');
  }

  const proof = Object.freeze({
    provider: 'cloudflare-pages-api',
    accountId,
    projectName: PROJECT,
    deploymentId,
    deploymentUrl,
    commitSha: trigger.metadata.commit_hash,
    environment: deployment.environment,
  });
  trustedProofs.add(proof);
  return proof;
}

export function isTrustedCloudflareDeploymentProof(proof, { requestedUrl, expectedCommitSha } = {}) {
  if (!proof || !trustedProofs.has(proof)) return false;
  try {
    return proof.deploymentUrl === requireImmutableCloudflareOrigin(requestedUrl) &&
      SHA.test(expectedCommitSha ?? '') && proof.commitSha === expectedCommitSha;
  } catch {
    return false;
  }
}
