# Node 24 runtime upgrade note

Date: 2026-07-01

This release updates the project runtime engine from Node 20.x to Node 24.x in `package.json`.

## Why

Vercel production build logs warned that Node.js 20.x is deprecated and that deployments created on or after 2026-10-01 will fail unless the project uses Node.js 24.

## Scope

- `package.json` now declares `engines.node` as `24.x`.
- No dependency versions or application runtime code are changed in this patch.

## Verification target

The expected verification is a Vercel preview/production build that no longer emits the Node 20 deprecation warning.
