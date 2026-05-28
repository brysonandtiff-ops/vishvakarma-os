import { isFirebaseConfigured } from './firebase/firebaseClient';
import { isSupabaseConfigured } from '@/db/supabase';

export type BackendMode = 'connected' | 'local-only';

/**
 * Central backend posture for Vishvakarma.OS.
 *
 * Auth is Firebase-first. Persistence (projects, specs, registry, change
 * requests, releases, audit logs) remains on Supabase as the legacy data
 * backend until a full data migration is performed.
 */
export const backendConfig = {
  authProvider: 'firebase' as const,
  dataProvider: 'supabase' as const,
  isAuthConfigured: isFirebaseConfigured,
  isDataConfigured: isSupabaseConfigured,
  authMode: (isFirebaseConfigured ? 'connected' : 'local-only') as BackendMode,
  dataMode: (isSupabaseConfigured ? 'connected' : 'local-only') as BackendMode,
} as const;

export const isAuthConfigured = backendConfig.isAuthConfigured;
export const authMode = backendConfig.authMode;
