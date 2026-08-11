import { APP_VERSION_RAW } from '../src/config/appVersion';
import {
  applyApiSecurityHeaders,
  enforceApiMethod,
  type SecureApiRequest,
  type SecureApiResponse,
} from './_lib/httpSecurity';

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
  const serverSecretConfigured = isConfigured(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const ok = supabaseUrlConfigured && serverSecretConfigured;

  return res.status(ok ? 200 : 503).json({
    ok,
    version: APP_VERSION_RAW,
    service: 'vishvakarma-os',
    timestamp: new Date().toISOString(),
  });
}
