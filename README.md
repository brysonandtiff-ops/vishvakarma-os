# Vishvakarma.OS

Vishvakarma.OS is an iPad-first, browser-native architectural workstation for 2D planning, live 3D review, governance, exports, and AI-assisted design.

## Start here

All application code, documentation, migrations, and development commands live at the repository root.

- **Documentation hub:** [docs/README.md](docs/README.md)
- **Valuation / due diligence:** [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
- **Canonical production target:** https://vishvakarma-os.app
- **Deployment truth:** verify the current Cloudflare deployment and exact source SHA before describing the current build as live or certified.

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

## Verification policy

Repository workflows can run automated verification gates, but they are not the release authority. Current certification requires S.I.R.E. evidence tied to the exact candidate SHA, including the relevant build, browser, accessibility, security, runtime, deployment, provenance, and independent-verification gates. Historical green workflow results remain historical after the repository advances.

```bash
pnpm run verify:ci
PLAYWRIGHT_BROWSERS=all pnpm run test:e2e
pnpm run test:e2e:a11y
pnpm run test:e2e:perf
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

Phone MFA remains an explicit paid-control exception until an SMS provider, recovery flow, and recurring Advanced MFA Phone cost are approved. TOTP and leaked-password protection are required controls.
