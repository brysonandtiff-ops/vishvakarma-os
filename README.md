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

GitHub Actions is intentionally disabled by owner policy. Release verification is run locally and recorded under `docs/release/evidence/`; Vercel remains the deployment status provider.

```bash
pnpm run verify:ci
pnpm run test:e2e
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```
