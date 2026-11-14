// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  attestCloudflareDeployment,
  isTrustedCloudflareDeploymentProof,
  requireImmutableCloudflareOrigin,
} from './cloudflare-deployment-proof.mjs';

const sha = 'a'.repeat(40);
const url = 'https://f64788e9.vishvakarma-os.pages.dev';
const env = {
  CLOUDFLARE_ACCOUNT_ID: '023e105f4ecef8ad9ca31a8372d0c353',
  CLOUDFLARE_DEPLOYMENT_ID: 'f64788e9-fccd-4d4a-a28a-cb84f88f6e12',
  CLOUDFLARE_API_TOKEN: 'synthetic-unit-test-token',
};

// Public Cloudflare Pages GET deployment envelope, narrowed to fields we use.
// https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/get/
function apiDeployment() {
  return {
    success: true, errors: [], messages: [],
    result: {
      id: env.CLOUDFLARE_DEPLOYMENT_ID, short_id: 'f64788e9',
      project_name: 'vishvakarma-os', environment: 'preview', url,
      aliases: ['https://main.vishvakarma-os.pages.dev'], is_skipped: false,
      latest_stage: { name: 'deploy', status: 'success' },
      source: { type: 'github', config: { repo_name: 'vishvakarma-os' } },
      deployment_trigger: {
        type: 'github:push',
        metadata: { branch: 'main', commit_hash: sha, commit_dirty: false, commit_message: 'Public fixture' },
      },
      env_vars: { PRIVATE_BUILD_VALUE: { type: 'plain_text', value: 'DO-NOT-PERSIST' } },
    },
  };
}

function attest(payload = apiDeployment(), options = {}) {
  return attestCloudflareDeployment({
    requestedUrl: url, expectedCommitSha: sha, env,
    fetchFn: async () => new Response(JSON.stringify(payload)),
    ...options,
  });
}

describe('authenticated Cloudflare source attestation', () => {
  it('uses one fixed read-only API request and retains only frozen safe provenance', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(apiDeployment())));
    const proof = await attest(undefined, { fetchFn });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe(
      'https://api.cloudflare.com/client/v4/accounts/023e105f4ecef8ad9ca31a8372d0c353/pages/projects/vishvakarma-os/deployments/f64788e9-fccd-4d4a-a28a-cb84f88f6e12',
    );
    expect(fetchFn.mock.calls[0][1]).toMatchObject({
      method: 'GET', redirect: 'error', cache: 'no-store',
      headers: { Authorization: 'Bearer synthetic-unit-test-token', Accept: 'application/json' },
    });
    expect(fetchFn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(proof).toEqual({
      provider: 'cloudflare-pages-api', accountId: env.CLOUDFLARE_ACCOUNT_ID,
      projectName: 'vishvakarma-os', deploymentId: env.CLOUDFLARE_DEPLOYMENT_ID,
      deploymentUrl: url, commitSha: sha, environment: 'preview',
    });
    expect(Object.isFrozen(proof)).toBe(true);
    expect(JSON.stringify(proof)).not.toMatch(/DO-NOT-PERSIST|synthetic-unit-test-token|env_vars/);
    expect(isTrustedCloudflareDeploymentProof(proof, { requestedUrl: url, expectedCommitSha: sha })).toBe(true);
    expect(isTrustedCloudflareDeploymentProof(JSON.parse(JSON.stringify(proof)), {
      requestedUrl: url, expectedCommitSha: sha,
    })).toBe(false);
  });

  it.each([
    'https://example.org', 'https://vishvakarma-os.app',
    'https://vishvakarma-os.pages.dev', 'https://main.vishvakarma-os.pages.dev',
    'https://f64788e9.vishvakarma-os.pages.dev.evil.org',
    'https://f64788e9.vishvakarma-os.pages.dev@evil.org',
    'https://user@f64788e9.vishvakarma-os.pages.dev',
    'https://f64788e9.vishvakarma-os.pages.dev:443',
    'https://f64788e9.vishvakarma-os.pages.dev:444',
    `${url}/editor`, `${url}?token=secret`, `${url}#fragment`,
    'http://f64788e9.vishvakarma-os.pages.dev', undefined,
  ])('rejects unsupported/lookalike origin before any request: %s', async (requestedUrl) => {
    const fetchFn = vi.fn();
    await expect(attest(undefined, { requestedUrl, fetchFn })).rejects.toThrow(/origin|aliases/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('normalizes only an optional root slash', () => {
    expect(requireImmutableCloudflareOrigin(`${url}/`)).toBe(url);
  });

  it.each([
    ['CLOUDFLARE_API_TOKEN', undefined], ['CLOUDFLARE_ACCOUNT_ID', undefined],
    ['CLOUDFLARE_DEPLOYMENT_ID', undefined], ['CLOUDFLARE_ACCOUNT_ID', '../other'],
    ['CLOUDFLARE_DEPLOYMENT_ID', '../other'], ['CLOUDFLARE_API_TOKEN', 'bad\nheader'],
  ])('fails closed for missing or malformed %s', async (key, value) => {
    const fetchFn = vi.fn();
    await expect(attest(undefined, { env: { ...env, [key]: value }, fetchFn })).rejects.toThrow(/Authenticated deployment proof requires/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it.each([
    ['old SHA', (d) => { d.deployment_trigger.metadata.commit_hash = 'b'.repeat(40); }],
    ['short SHA', (d) => { d.deployment_trigger.metadata.commit_hash = 'a'.repeat(8); }],
    ['missing SHA', (d) => { delete d.deployment_trigger.metadata.commit_hash; }],
    ['dirty commit', (d) => { d.deployment_trigger.metadata.commit_dirty = true; }],
    ['missing clean metadata', (d) => { delete d.deployment_trigger.metadata.commit_dirty; }],
    ['direct upload', (d) => { d.deployment_trigger.type = 'ad_hoc'; }],
    ['no source control', (d) => { delete d.source; }],
    ['wrong project', (d) => { d.project_name = 'vishvakarma-os-copy'; }],
    ['wrong deployment ID', (d) => { d.id = 'f64788e9-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; }],
    ['wrong short ID', (d) => { d.short_id = '11111111'; }],
    ['different deployment URL', (d) => { d.url = 'https://11111111.vishvakarma-os.pages.dev'; }],
    ['branch URL', (d) => { d.url = d.aliases[0]; }],
    ['failed deploy', (d) => { d.latest_stage.status = 'failure'; }],
    ['unfinished deploy', (d) => { d.latest_stage.name = 'build'; }],
    ['skipped deploy', (d) => { d.is_skipped = true; }],
    ['missing status', (d) => { delete d.latest_stage; }],
  ])('rejects %s from authenticated metadata', async (_name, mutate) => {
    const payload = apiDeployment();
    mutate(payload.result);
    await expect(attest(payload)).rejects.toThrow(/does not attest/);
  });

  it('rejects a stale local expectation and a different requested preview for a trusted proof', async () => {
    const proof = await attest();
    expect(isTrustedCloudflareDeploymentProof(proof, { requestedUrl: url, expectedCommitSha: 'b'.repeat(40) })).toBe(false);
    expect(isTrustedCloudflareDeploymentProof(proof, {
      requestedUrl: 'https://11111111.vishvakarma-os.pages.dev', expectedCommitSha: sha,
    })).toBe(false);
  });

  it.each([401, 403, 404, 302, 500])('fails closed on HTTP %s without exposing response values', async (status) => {
    await expect(attest(undefined, {
      fetchFn: async () => new Response('PRIVATE-API-ERROR', { status }),
    })).rejects.toThrow('Cloudflare deployment metadata is unavailable or invalid; browser release proof is held.');
  });

  it('sanitizes thrown errors and invalid/oversized responses', async () => {
    for (const fetchFn of [
      async () => { throw new Error('PRIVATE-API-ERROR'); },
      async () => new Response('PRIVATE-API-ERROR'),
      async () => new Response(' '.repeat(1_048_577)),
    ]) {
      await expect(attest(undefined, { fetchFn })).rejects.toThrow(
        'Cloudflare deployment metadata is unavailable or invalid; browser release proof is held.',
      );
    }
  });

  it('rejects unsuccessful or missing API metadata', async () => {
    for (const payload of [{}, { success: false }, { ...apiDeployment(), errors: [{ message: 'PRIVATE-ERROR' }] }]) {
      await expect(attest(payload)).rejects.toThrow(/does not attest/);
    }
  });
});
