import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyApiSecurityHeaders,
  enforceApiMethod,
  type SecureApiRequest,
  type SecureApiResponse,
} from './_lib/httpSecurity';

function readPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { version?: unknown };
    return typeof packageJson.version === 'string'
      ? packageJson.version
      : 'unknown';
  } catch {
    return 'unknown';
  }
}

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('your-')) return false;
  if (trimmed.includes('placeholder')) return false;
  return true;
}

export default function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['GET', 'HEAD'])) return;

  const supabaseUrlConfigured = isConfigured(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  );
  const serviceRoleConfigured = isConfigured(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const ok = supabaseUrlConfigured && serviceRoleConfigured;

  return res.status(ok ? 200 : 503).json({
    ok,
    version: readPackageVersion(),
    service: 'vishvakarma-os',
    timestamp: new Date().toISOString(),
  });
}
