import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseConfigurationError, isSupabaseConfigured, supabase, supabaseMode } from '@/db/supabase';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  mode: 'connected' | 'local-only';
  requestAccessLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeMagicLinkError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('networkerror')) {
      return new Error(
        'Magic-link request could not reach Supabase. Check that VITE_SUPABASE_URL is a real Supabase project URL, VITE_SUPABASE_ANON_KEY is the matching anon key, and the deployment can access the internet.'
      );
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (nextUser: User | null) => {
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
    let mounted = true;

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
      const configurationError = getSupabaseConfigurationError();
      if (configurationError) {
        throw new Error(configurationError);
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

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
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
      isConfigured: isSupabaseConfigured,
      mode: supabaseMode,
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
