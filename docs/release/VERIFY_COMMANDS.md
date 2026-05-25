# Vishvakarma.OS Verification Commands

Use this file as the short local verification guide for this branch.

## Standard Check

```bash
pnpm install --frozen-lockfile
pnpm run launch:evidence
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
```

## Browser Check

```bash
pnpm run test:e2e
```

## Release Gate Check

```bash
pnpm run release:gates
```

`release:gates` can return a non-zero code while manual evidence is still pending. That means the software is not cleared for public release evidence claims yet; it does not automatically mean the build is broken.

## Final Evidence Check

Use this only after all placeholders in the evidence files are filled:

```bash
pnpm run launch:evidence:strict
```
