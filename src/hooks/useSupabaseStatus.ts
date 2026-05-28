import { useMemo } from 'react';
import { backendStatus } from '@/backend/backendConfig';
import { isSupabaseConfigured } from '@/db/supabase';

/**
 * True when cloud persistence (Supabase) is configured and the active provider can use it.
 */
export function useSupabaseStatus() {
  return useMemo(() => {
    if (!backendStatus.isConfigured) return false;
    if (backendStatus.provider === 'firebase') return false;
    return isSupabaseConfigured;
  }, []);
}
