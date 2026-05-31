import { useMemo } from 'react';
import { backendStatus } from '@/backend/backendConfig';
import { isSupabaseConfigured } from '@/db/supabase';

export type CloudSaveLabel = 'Firebase Cloud Save' | 'Supabase Cloud Save' | 'Local Draft';

/**
 * Cloud persistence status for the active backend provider.
 */
export function useCloudSaveStatus(): { connected: boolean; label: CloudSaveLabel } {
  return useMemo(() => {
    if (!backendStatus.isConfigured) {
      return { connected: false, label: 'Local Draft' };
    }

    if (backendStatus.provider === 'firebase') {
      return { connected: true, label: 'Firebase Cloud Save' };
    }

    return {
      connected: isSupabaseConfigured,
      label: 'Supabase Cloud Save',
    };
  }, []);
}

/** @deprecated Use useCloudSaveStatus */
export function useSupabaseStatus() {
  const { connected } = useCloudSaveStatus();
  return connected;
}
