import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const hasSupabaseAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;

export const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseAnonKey;

export const supabaseMode = isSupabaseConfigured ? 'connected' : 'local-only';

const fallbackSupabaseUrl = 'https://local-only.invalid.supabase.co';
const fallbackSupabaseAnonKey = 'local-only-placeholder-anon-key-not-for-production';

if (!isSupabaseConfigured) {
  console.warn(
    '[Vishvakarma.OS] Supabase is not configured. The app is running in local-only mode. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable persistence, registry, releases, and audit logs.'
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
