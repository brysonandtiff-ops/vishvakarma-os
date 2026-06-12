import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { backendStatus } from '@/backend/backendConfig';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL as string | undefined;
}

export function getSupabaseAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!backendStatus.isConfigured || backendStatus.provider !== 'supabase') {
    return null;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient();
