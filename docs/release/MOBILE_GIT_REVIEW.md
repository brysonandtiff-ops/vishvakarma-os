# Vishvakarma.OS Mobile Git Review Guide

## Purpose

This guide lets the repo owner review this branch from a phone without losing the evidence-check context.

## Current Branch

```txt
value/evidence-completeness-guard-20260525
```

## Current PR

```txt
PR #4 — Add evidence check
```

## What This Branch Adds

- Evidence completeness checker.
- Template mode and strict mode commands.
- Verification workflow wiring.
- Short local verification command guide.

## Files To Inspect On Mobile

```txt
scripts/quality/check-launch-evidence.mjs
package.json
.github/workflows/verify.yml
docs/release/VERIFY_COMMANDS.md
```

## Local Verification Commands

Run when back at desktop:

```bash
pnpm install --frozen-lockfile
pnpm run launch:evidence
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run test:e2e
pnpm run release:gates
```

## Strict Evidence Command

Run only after the real evidence files are filled:

```bash
pnpm run launch:evidence:strict
```

## Merge Rule

Only merge when:

- GitHub says the PR is mergeable.
- Template evidence check passes.
- Standard lint/test/build commands pass or CI is green.
- `release:gates` behaviour is understood: it may block until manual evidence is filled.

## Merge Command

```bash
gh pr merge 4 --squash --delete-branch
```

## After Merge

```bash
git switch main
git pull --ff-only
```
