# Allow-listed verification policy

GitHub Actions is restricted to one audited workflow in this repository.

- `production-certification.yml` is the only executable workflow allowed.
- It runs on every push to `main` and by explicit manual dispatch.
- It verifies hosted Supabase Auth hardening, cross-browser E2E, accessibility, performance, production auth, strict release gates, and strict launch evidence.
- No other `.yml` or `.yaml` workflow may be added without updating the release-hardening test and owner policy.
- Cloudflare Pages is the configured hosting provider. GitHub certification is verification only: it does not deploy production, grant deployment approval, enable paid Actions usage, or authorize promotion.
- Evidence artifacts are retained for review and must remain bound to the exact tested SHA.

This replaces the former local-only rule with a narrow, test-enforced allow list.
