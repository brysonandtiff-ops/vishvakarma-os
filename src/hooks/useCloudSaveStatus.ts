import { useMemo } from 'react';
import { backendStatus } from '@/backend/backendConfig';

export type CloudSaveLabel = 'Firebase Cloud Save' | 'Local Draft';

/**
 * Cloud persistence status for Firebase Firestore.
 */
export function useCloudSaveStatus(): { connected: boolean; label: CloudSaveLabel } {
  return useMemo(() => {
    if (!backendStatus.isConfigured) {
      return { connected: false, label: 'Local Draft' };
    }

    return { connected: true, label: 'Firebase Cloud Save' };
  }, []);
}
