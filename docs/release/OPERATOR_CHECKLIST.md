# Operator Release Checklist

**Current decision:** Production release is blocked. The local Studio freeze and observed Cloudflare SHAs are recorded in the [release decision](CURRENT_RELEASE_STATUS.md).

## 1. Verify the frozen source

- [ ] Confirm the Git tag, full source SHA, clean checkout and intended review branch.
- [ ] Run locked install, lint, full tests, routes, production build, artifact security, performance budgets and documentation verification.
- [ ] Run Chromium, Firefox and WebKit smoke coverage, keyboard and accessibility checks, and editor performance checks.
- [ ] Bind CI receipts to the exact SHA. Rerun checks after any code change.

```bash
pnpm install --frozen-lockfile
pnpm run verify:ci
pnpm run docs:verify
pnpm run handoff:verify
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run test:e2e:perf
```

## 2. Clear infrastructure and account holds

- [ ] Independently verify provider credential rotation and close [security issue #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153).
- [ ] Verify a retained encrypted backup and an independent decrypt and restore. Close [backup issue #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188) with the redacted evidence.
- [ ] Verify Cloudflare Pages bindings and canonical Google and Supabase callback URLs with the responsible operator.
- [ ] Read hosted Auth policy. Verify invitation-only sign-in, approved Google and email links, administrator access and tenant isolation with approved test accounts.
- [ ] Verify Stripe return destinations, entitlements and recovery in the appropriate approved environment.

```bash
node scripts/setup-supabase-auth-hardening.mjs --check
pnpm run verify:supabase-schema:live
pnpm run verify:production-auth-flow
```

## 3. Accept the exact hosted candidate

- [ ] Use the existing Cloudflare preview pipeline. Match the immutable deployment ID and URL to the Git SHA before browser testing.
- [ ] Exercise Projects → Studio → Blueprint → 3D → Walk → Save → Reopen → Export in a signed-in account. Reimport the export and verify the geometry. Confirm another tenant cannot access the project.
- [ ] Verify physical device controls, Safari and installed PWA behavior, audio, service-worker updates and offline recovery. Attach device, browser, time, screenshots or video, and any failures.
- [ ] Run the production-target verifier and strict gates against the attested preview.

```bash
node scripts/deployment/certify-cloudflare-release.mjs https://<deployment>.vishvakarma-os.pages.dev
```

The certifier checks both GitHub holds, safety and build gates, strict launch evidence and live routing and headers. Use the approved Pages Read credentials and immutable deployment ID for SHA attestation. A strict-gate exit of `2` identifies outstanding manual evidence.

## 4. Promote after sign-off

- [ ] Obtain independent QA and explicit owner approval for the exact SHA and deployment. Record the prior deployment ID for rollback.
- [ ] Promote through the existing Cloudflare release path. Recheck the deployed SHA, canonical domain, health, cache headers, sign-in and a cloud save/reopen.
- [ ] Record the actual production deployment and approved release tag. Monitor Cloudflare error rates, frontend telemetry and auth errors after promotion.

Follow the [deployment guide](DEPLOYMENT.md), [production certification](CLOUDFLARE_PRODUCTION_CERTIFICATION.md), and [rollback instructions](../operations/ROLLBACK.md).
