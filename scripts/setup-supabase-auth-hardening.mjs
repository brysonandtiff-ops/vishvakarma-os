#!/usr/bin/env node

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.VITE_SUPABASE_PROJECT_REF ??
  'jyocvwipthswfcmvqgqe';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dryRun = process.argv.includes('--dry-run');
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

const desiredConfig = {
  // Supabase email/password is the only public account method.
  external_email_enabled: true,
  disable_signup: false,
  // Require users to confirm their email before the first sign-in.
  mailer_autoconfirm: false,
  external_google_enabled: false,
  password_hibp_enabled: true,
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  mfa_phone_enroll_enabled: false,
  mfa_phone_verify_enabled: false,
  mailer_notifications_password_changed_enabled: true,
  mailer_subjects_confirmation: 'Confirm your Vishvakarma.OS account',
  mailer_templates_confirmation_content:
    '<h2>Confirm your Vishvakarma.OS account</h2><p>Follow the secure link below to confirm your email address and finish creating your account.</p><p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p><p>If you did not request this account, you can ignore this email.</p>',
  mailer_subjects_recovery: 'Reset your Vishvakarma.OS password',
  mailer_templates_recovery_content:
    '<h2>Reset your Vishvakarma.OS password</h2><p>Follow the secure link below to choose a new password.</p><p><a href="{{ .ConfirmationURL }}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>',
  mailer_subjects_password_changed_notification:
    'Your Vishvakarma.OS password was changed',
  mailer_templates_password_changed_notification_content:
    '<h2>Your password was changed</h2><p>The password for your Vishvakarma.OS account was recently changed.</p><p>If you did not make this change, start password recovery immediately.</p>',
};

const verificationKeys = [
  'external_email_enabled',
  'disable_signup',
  'mailer_autoconfirm',
  'external_google_enabled',
  'password_hibp_enabled',
  'mfa_totp_enroll_enabled',
  'mfa_totp_verify_enabled',
  'mfa_phone_enroll_enabled',
  'mfa_phone_verify_enabled',
  'mailer_notifications_password_changed_enabled',
];

function safeConfig(config) {
  return Object.fromEntries(
    verificationKeys.map((key) => [key, config?.[key]]),
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
  console.log('[supabase-auth-hardening] Target policy: email signup + confirmation + recovery; social login disabled.');

  if (dryRun) {
    console.log('[supabase-auth-hardening] Desired:', safeConfig(desiredConfig));
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

  await managementRequest('PATCH', desiredConfig);

  const after = await managementRequest('GET');
  console.log('[supabase-auth-hardening] After:', safeConfig(after));
  const mismatches = verificationKeys.filter(
    (key) => after?.[key] !== desiredConfig[key],
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Auth configuration verification failed: ${mismatches
        .map((key) => `${key} expected ${String(desiredConfig[key])} got ${String(after?.[key])}`)
        .join(', ')}`,
    );
  }

  console.log('[supabase-auth-hardening] PASS: Hosted email signup, confirmation, recovery, and password security are enabled.');
}

main().catch((error) => {
  console.error(
    '[supabase-auth-hardening] Failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
