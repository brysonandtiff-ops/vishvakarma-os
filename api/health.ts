import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function readPackageVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    return typeof packageJson.version === 'string' ? packageJson.version : 'unknown';
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const checks = {
    supabaseConfigured: isConfigured(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL),
    stripeConfigured: isConfigured(process.env.STRIPE_SECRET_KEY),
    geminiConfigured: isConfigured(process.env.GEMINI_API_KEY),
  };

  const ok = Object.values(checks).some(Boolean);

  return res.status(ok ? 200 : 503).json({
    ok,
    version: readPackageVersion(),
    service: 'vishvakarma-os',
    checks,
    timestamp: new Date().toISOString(),
  });
}
