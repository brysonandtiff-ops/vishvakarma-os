import { createContext, useContext } from 'react';
import type { Profile } from '@/types';
import type { FirebaseSessionSnapshot } from '@/backend/firebase/firebaseAuthGateway';
import type { SupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';

export type AuthUser = {
  id: string;
  email: string;
  provider: 'firebase' | 'supabase';
};

export type AuthSession = FirebaseSessionSnapshot | SupabaseSessionSnapshot;

export type EmailLinkState = 'idle' | 'completing' | 'needs_email' | 'error';

export interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  mode: 'connected' | 'local-only';
  emailLinkState: EmailLinkState;
  emailLinkError: string | null;
  requestAccessLink: (email: string) => Promise<{ error: Error | null }>;
  completeEmailLinkSignIn: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; redirecting?: boolean }>;
  signInWithApple: () => Promise<{ error: Error | null; redirecting?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
