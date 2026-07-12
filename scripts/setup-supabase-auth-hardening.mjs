#!/usr/bin/env node

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.VITE_SUPABASE_PROJECT_REF ??
  'jyocvwipthswfcmvqgqe';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dryRun = process.argv.includes('--dry-run');
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

const desiredConfig = {
  // Password login is disabled by product policy, but HIBP remains enabled as
  // defense in depth for any legacy password account still present in Auth.
  password_hibp_enabled: true,
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  // Phone MFA is a paid add-on and requires an approved SMS provider. Keep it
  // disabled until product, cost, and recovery workflows are explicitly approved.
  mfa_phone_enroll_enabled: false,
  mfa_phone_verify_enabled: false,
};

function safeConfig(config) {
  return Object.fromEntries(
    Object.keys(desiredConfig).map((key) => [key, config?.[key]]),
  );
}

async function managementRequest(method, body) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const message =
      payload?.message ?? payload?.error ?? `Management API returned ${response.status}`;
    throw new Error(String(message));
  }

  return payload;
}

async function main() {
  console.log(`[supabase-auth-hardening] Project: ${projectRef}`);
  console.log('[supabase-auth-hardening] Desired:', desiredConfig);

  if (dryRun) {
    console.log('[supabase-auth-hardening] Dry run complete; no remote settings changed.');
    return;
  }

  if (!accessToken) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN is required. Create a personal access token in Supabase account settings and keep it out of Git.',
    );
  }

  const before = await managementRequest('GET');
  console.log('[supabase-auth-hardening] Before:', safeConfig(before));

  const updated = await managementRequest('PATCH', desiredConfig);
  console.log('[supabase-auth-hardening] Updated:', safeConfig(updated));

  const after = await managementRequest('GET');
  const mismatches = Object.entries(desiredConfig).filter(
    ([key, value]) => after?.[key] !== value,
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Auth configuration verification failed: ${mismatches
        .map(([key, value]) => `${key} expected ${String(value)} got ${String(after?.[key])}`)
        .join(', ')}`,
    );
  }

  console.log('[supabase-auth-hardening] Hosted Auth hardening verified.');
}

main().catch((error) => {
  console.error(
    '[supabase-auth-hardening] Failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
