import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/backend/firebase/firebaseClient';
import { authMode } from '@/backend/backendConfig';
import { isSupabaseConfigured, supabase } from '@/db/supabase';
import type { Profile } from '@/types';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthSession {
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  mode: 'connected' | 'local-only';
  requestAccessLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PENDING_EMAIL_KEY = 'vishvakarma:auth:pending-email';

function toAuthUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Vishvakarma.OS] Failed to fetch user profile:', error);
    return null;
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const loadProfile = useCallback(async (nextUser: AuthUser | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await getProfile(nextUser.id);
    setProfile(nextProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      return;
    }

    const auth = firebaseAuth;
    let mounted = true;

    // Complete a passwordless email-link sign-in if the user arrived via the link.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem(PENDING_EMAIL_KEY);
      const email = storedEmail ?? window.prompt('Confirm your email to complete secure sign-in') ?? '';

      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem(PENDING_EMAIL_KEY);
            window.history.replaceState(null, '', window.location.pathname);
          })
          .catch((error) => {
            console.error('[Vishvakarma.OS] Email-link sign-in failed:', error);
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;
      const nextUser = firebaseUser ? toAuthUser(firebaseUser) : null;
      setUser(nextUser);
      setLoading(false);
      void loadProfile(nextUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const requestAccessLink = useCallback(async (email: string) => {
    try {
      if (!isFirebaseConfigured || !firebaseAuth) {
        throw new Error('Firebase is not configured. Add environment variables to enable secure access.');
      }

      const normalizedEmail = email.trim().toLowerCase();
      await sendSignInLinkToEmail(firebaseAuth, normalizedEmail, {
        url: window.location.origin,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(PENDING_EMAIL_KEY, normalizedEmail);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }

    setUser(null);
    setProfile(null);
  }, []);

  const session = useMemo<AuthSession | null>(() => (user ? { user } : null), [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isConfigured: isFirebaseConfigured,
      mode: authMode,
      requestAccessLink,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, requestAccessLink, session, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
