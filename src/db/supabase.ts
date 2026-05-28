import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isPlaceholderValue(value: unknown) {
  if (typeof value !== 'string') return true;
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized.includes('your-project') ||
    normalized.includes('your-supabase') ||
    normalized.includes('placeholder') ||
    normalized.includes('example.com')
  );
}

const hasSupabaseUrl =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !isPlaceholderValue(supabaseUrl);

const hasSupabaseAnonKey =
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 20 &&
  !isPlaceholderValue(supabaseAnonKey);

export const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseAnonKey;

export const supabaseMode = isSupabaseConfigured ? 'connected' : 'local-only';

export function getSupabaseConfigurationError() {
  if (isSupabaseConfigured) return null;

  const missing: string[] = [];
  if (!hasSupabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!hasSupabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  return `Supabase is not configured for magic-link access. Set real ${missing.join(' and ')} values in your local .env.local or Vercel environment variables.`;
}

const fallbackSupabaseUrl = 'https://local-only.invalid.supabase.co';
const fallbackSupabaseAnonKey = 'local-only-placeholder-anon-key-not-for-production';

if (!isSupabaseConfigured) {
  console.warn(
    '[Vishvakarma.OS] Supabase is not configured. The app is running in local-only mode. ' +
      'Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values to enable magic links, persistence, registry, releases, and audit logs.'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackSupabaseUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
);
