import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { backendStatus } from '@/backend/backendConfig';
import {
  clearFirebaseSessionSnapshot,
  completeFirebaseEmailLinkSignIn,
  readFirebaseSessionSnapshot,
  requestFirebaseAccessLink,
  type FirebaseSessionSnapshot,
} from '@/backend/firebase/firebaseAuthGateway';
import { signInWithAppleFirebase, signInWithGoogleFirebase } from '@/backend/firebase/firebaseOAuthGateway';
import { isSupabaseConfigured, supabase, supabaseMode } from '@/db/supabase';
import type { Profile } from '@/types';

type FirebaseAuthUser = {
  id: string;
  email: string;
  provider: 'firebase';
};

type AuthUser = User | FirebaseAuthUser;
type AuthSession = Session | FirebaseSessionSnapshot;

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  mode: 'connected' | 'local-only';
  requestAccessLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function firebaseUserFromSession(session: FirebaseSessionSnapshot): FirebaseAuthUser {
  return {
    id: session.uid,
    email: session.email,
    provider: 'firebase',
  };
}

function normalizeMagicLinkError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('networkerror')) {
      const providerLabel = backendStatus.provider === 'firebase' ? 'Firebase Auth' : 'Supabase';
      return new Error(
        `Magic-link request could not reach ${providerLabel}. Check the active backend environment variables and deployment network access.`
      );
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (backendStatus.provider !== 'supabase') return null;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(backendStatus.isConfigured);

  const loadProfile = useCallback(async (nextUser: AuthUser | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    if (backendStatus.provider !== 'supabase') {
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
    let mounted = true;

    if (!backendStatus.isConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (backendStatus.provider === 'firebase') {
      if (!backendStatus.isConfigured) {
        setLoading(false);
        return () => {
          mounted = false;
        };
      }

      completeFirebaseEmailLinkSignIn()
        .then(({ session: nextSession, error }) => {
          if (!mounted) return;
          if (error) throw error;

          const restoredSession = nextSession ?? readFirebaseSessionSnapshot();
          setSession(restoredSession);
          setUser(restoredSession ? firebaseUserFromSession(restoredSession) : null);
          setProfile(null);
        })
        .catch((error) => {
          console.error('[Vishvakarma.OS] Firebase auth session read failed:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;

        const nextSession = data.session ?? null;
        const nextUser = nextSession?.user ?? null;
        setSession(nextSession);
        setUser(nextUser);
        await loadProfile(nextUser);
      })
      .catch((error) => {
        console.error('[Vishvakarma.OS] Auth session read failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);
      void loadProfile(nextUser);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const requestAccessLink = useCallback(async (email: string) => {
    try {
      if (backendStatus.provider === 'firebase') {
        return await requestFirebaseAccessLink(email, `${window.location.origin}/auth`);
      }

      if (!backendStatus.isConfigured) {
        throw new Error(
          backendStatus.configurationError ??
            'Supabase is not configured. Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.'
        );
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: normalizeMagicLinkError(error) };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (backendStatus.provider === 'firebase') {
        const session = await signInWithGoogleFirebase();
        if (session) {
          setSession(session);
          setUser(firebaseUserFromSession(session));
        }
        return { error: null };
      }

      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Backend is not configured.');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Google sign-in failed.') };
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      if (backendStatus.provider === 'firebase') {
        const session = await signInWithAppleFirebase();
        if (session) {
          setSession(session);
          setUser(firebaseUserFromSession(session));
        }
        return { error: null };
      }

      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Backend is not configured.');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Apple sign-in failed.') };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (backendStatus.provider === 'firebase') {
      clearFirebaseSessionSnapshot();
    } else if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }

    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isConfigured: backendStatus.isConfigured,
      mode: backendStatus.provider === 'supabase' ? supabaseMode : backendStatus.mode,
      requestAccessLink,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, requestAccessLink, session, signInWithApple, signInWithGoogle, signOut, user]
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
