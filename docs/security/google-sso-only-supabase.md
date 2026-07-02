# Google SSO-only Supabase guard

Vishvakarma.OS production auth is Google SSO-only.

## Enforced in the app

- `/auth` exposes only the Google SSO CTA.
- No email input, password input, magic-link action, password reset, or local demo login is visible.
- `e2e/full-customer-audit.spec.ts` verifies the Google-only auth surface across desktop, iPad, and phone viewports.

## Supabase project

- Project ref: `jyocvwipthswfcmvqgqe`
- Project name: `Vishvakarma.OS`
- Region: `ap-southeast-1`

## Direct Supabase auth-schema trigger attempt

A database-level trigger on `auth.identities` was attempted from the Supabase MCP role to reject any identity whose provider was not `google`.

Supabase rejected this with:

```text
permission denied for schema auth
```

That means this MCP role cannot directly install triggers inside Supabase's protected auth schema.

## Required dashboard owner setting

To make non-Google authentication impossible at the Supabase Auth service level, an owner must verify:

1. Authentication → Providers → Google: enabled.
2. Authentication → Providers → Email: disabled if available for the project plan/config.
3. Authentication → Providers → Phone: disabled.
4. Authentication → Providers → Apple/GitHub/etc: disabled.
5. Authentication → URL Configuration → Redirect URLs includes `https://vishvakarma-os.app/auth`.

## Remaining security advisors

The latest Supabase advisor scan still reports unrelated security warnings around public GraphQL exposure, broad storage bucket listing, permissive audit log insert policy, SECURITY DEFINER functions callable by anon/authenticated, leaked-password protection, and MFA options. Those should be handled as a separate database security PR because they are not part of the Google-only auth UI/session path.
