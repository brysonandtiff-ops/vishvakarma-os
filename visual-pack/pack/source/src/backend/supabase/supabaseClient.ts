import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { backendStatus, resolveSupabaseConfig } from '@/backend/backendConfig';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseUrl() {
  return resolveSupabaseConfig().url;
}

export function getSupabaseAnonKey() {
  return resolveSupabaseConfig().anonKey;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!backendStatus.isConfigured || backendStatus.provider !== 'supabase') {
    return null;
  }

  const { url, anonKey } = resolveSupabaseConfig();
  if (!url || !anonKey) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        // OAuth PKCE exchange is handled explicitly in resolveSupabaseOAuthRedirectSession.
        detectSessionInUrl: false,
        flowType: 'pkce',
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient();
