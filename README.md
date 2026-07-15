# Vishvakarma.OS

Vishvakarma.OS is an iPad-first, browser-native architectural workstation for 2D planning, live 3D review, governance, exports, and AI-assisted design.

## Start here

All application code, documentation, migrations, and development commands live at the repository root.

- **Documentation hub:** [docs/README.md](docs/README.md)
- **Valuation / due diligence:** [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
- **Production:** https://vishvakarma-os.app
- **Vercel fallback:** https://vishvakarma-os.vercel.app

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

## Verification policy

The allow-listed `.github/workflows/production-certification.yml` workflow certifies every `main` SHA with hosted Auth hardening, Chromium/Firefox/WebKit E2E, accessibility, editor performance, production-auth verification, and strict release evidence gates. Vercel separately verifies the production build.

```bash
pnpm run verify:ci
PLAYWRIGHT_BROWSERS=all pnpm run test:e2e
pnpm run test:e2e:a11y
pnpm run test:e2e:perf
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

Phone MFA remains an explicit paid-control exception until an SMS provider, recovery flow, and recurring Advanced MFA Phone cost are approved. TOTP and leaked-password protection are required controls.
