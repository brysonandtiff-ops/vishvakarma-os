# Vishvakarma.OS — Verified family administrator invitation (staged, not activated)

Approval email: ajkdentureventure@gmail.com (owner-authorised).
Source allowlist: src/config/coOwners.ts.
Current role source of truth: public.profiles.role in Supabase.

## Prepared in Git, NOT live
- New SQL migration requires auth.users.email_confirmed_at before granting an admin role and contains a verified-account backfill.
- Normal clients can change their own profile display name and avatar, but cannot change role, Stripe customer ID or billing plan.
- Client profile creation no longer performs a role-bearing upsert.
- A changed email is designed to lose the special email-based administrator role.

## Blocker and safe acceptance
Supabase project reports ACTIVE_HEALTHY but SQL and security advisor requests are timing out / hibernating. Migration application, exact grant state, new-account signup and actual iPad proof are UNVERIFIED.

Before applying this script, an authorised Supabase operator must inspect real profiles columns and grants, verify role policy and auth.users triggers, and create/validate the migration using the official Supabase CLI. The CLI is unavailable in this chat runtime, so the Git migration filename and SQL remain a draft candidate. Explicitly review the admin promotion trigger for ordering, anonymous access, and the exact verified mailbox. Do not promote production, adjust secrets, or waive issues #153/#188 without separate proof.

## Real tests required
- Approved account has verified email and receives admin only after confirmation.
- Unverified same address remains ordinary user.
- Other account can never promote role or billing fields via REST or client.
- One-session sign-in, sign-out, resume, and project save/reopen verified on a real iPad.
- Original artwork and user work preserved with no source drift.
