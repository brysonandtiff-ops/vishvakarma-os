// Cloudflare Pages project calls this entrypoint. Do not bypass the normal VISH build gates.
import { spawnSync } from 'node:child_process';
const result = spawnSync('pnpm', ['run', 'build'], { shell: true, stdio: 'inherit', env: process.env });
if (result.error) console.error('VISH build process failed:', result.error.message);
process.exit(result.status ?? 1);
