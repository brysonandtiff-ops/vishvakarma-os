# Supabase Auth Platform Decision — 2026-07-16

## Scope

Project: `jyocvwipthswfcmvqgqe`  
Application: Vishvakarma.OS  
Decision owner: Bryson Erdmann

## Required controls

The hosted Auth configuration must enforce:

- `password_hibp_enabled = true`;
- `mfa_totp_enroll_enabled = true`;
- `mfa_totp_verify_enabled = true`.

These values are applied and re-read through `scripts/setup-supabase-auth-hardening.mjs`. The Production Certification workflow fails when the management credential is unavailable or the verified values differ.

## Advanced Phone MFA decision

Phone MFA is intentionally disabled:

- `mfa_phone_enroll_enabled = false`;
- `mfa_phone_verify_enabled = false`.

This is an explicit product and risk decision, not an overlooked toggle.

Reasons:

1. Hosted Advanced MFA Phone is a separately billed recurring add-on.
2. SMS delivery requires a configured and approved provider.
3. The product does not yet expose phone-factor enrollment, recovery, number-change, or support workflows.
4. Phone factors introduce SIM-swap and recycled-number risks that TOTP avoids.
5. Enabling the server setting without a complete provider and UX would advertise a factor that users cannot safely complete.

## Advisor disposition

- `auth_leaked_password_protection`: must resolve to enabled.
- `auth_insufficient_mfa_options`: accepted with this documented exception while TOTP remains enabled and enforced for enrolled users.

## Reconsideration trigger

Reopen this decision only when all of the following exist:

- explicit approval of the recurring add-on cost;
- approved SMS or WhatsApp provider credentials;
- enrollment, challenge, recovery, number-change, and unenrollment UX;
- abuse/rate-limit monitoring;
- SIM-swap and account-recovery support procedures;
- end-to-end tests across the supported browser and device matrix.

## Verdict

`PASS-WITH-DOCUMENTED-EXCEPTION` — leaked-password protection and TOTP are mandatory; Advanced Phone MFA is deliberately not enabled until the complete paid capability is approved and supportable.
