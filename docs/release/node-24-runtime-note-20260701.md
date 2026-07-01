# Node 24 runtime verification target

Date: 2026-07-01

This short note captures the release reason for moving `engines.node` from `20.x` to `24.x`.

Vercel production build logs warned that Node.js 20.x is deprecated and that future deployments will fail unless the project uses Node.js 24.

No application runtime code or dependency versions are changed in this patch.
