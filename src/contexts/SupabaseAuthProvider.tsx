import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backendStatus } from '@/backend/backendConfig';
import {
  buildSupabaseSessionFromAuthSession,
  clearSupabaseSessionSnapshot,
  completeSupabaseEmailLinkSignIn,
  hydrateSupabaseAuthSession,
  isSupabaseEmailLinkCallback,
  isSupabaseOAuthCallback,
  readCachedAuthBootstrap,
  requestSupabaseAccessLink,
  signOutSupabaseAuth,
} from '@/backend/supabase/supabaseAuthGateway';
import {
  clearOAuthRedirectPending,
  consumeOAuthRedirectPending,
  expireStaleOAuthRedirectPending,
  formatAuthError,
  formatOAuthRedirectIncompleteMessage,
  isOAuthRedirectPending,
  POST_AUTH_DESTINATION,
  readAndClearAuthReturnPath,
  resolveSupabaseOAuthRedirectSession,
  signInWithAppleSupabase,
  signInWithGoogleSupabase,
} from '@/backend/supabase/supabaseOAuthGateway';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';
import { ensureSupabaseProfile, getSupabaseProfile } from '@/backend/supabase/supabaseProfileGateway';
import { markFreshSignIn } from '@/editor/onboardingMemory';
import type { Profile } from '@/types';
import {
  AuthContext,
  type AuthContextType,
  type AuthSession,
  type AuthUser,
  type EmailLinkState,
} from '@/contexts/authContextTypes';

function supabaseUserFromSession(session: AuthSession): AuthUser {
  return {
    id: session.uid,
    email: session.email,
    provider: 'supabase',
  };
}

function normalizeMagicLinkError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('networkerror')) {
      return new Error(
        'Magic-link request could not reach Supabase Auth. Check Supabase environment variables and deployment network access.'
      );
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!backendStatus.isConfigured) return null;

  try {
    return await getSupabaseProfile(userId);
  } catch (error) {
    console.error('[Vishvakarma.OS] Failed to fetch user profile:', error);
    return null;
  }
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const bootstrapSession = readCachedAuthBootstrap();
  const [session, setSession] = useState<AuthSession | null>(bootstrapSession);
  const [user, setUser] = useState<AuthUser | null>(
    bootstrapSession ? supabaseUserFromSession(bootstrapSession) : null
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(() => backendStatus.isConfigured);
  const [emailLinkState, setEmailLinkState] = useState<EmailLinkState>('idle');
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null);

  const loadProfile = useCallback(async (nextUser: AuthUser | null) => {
    if (!nextUser || !backendStatus.isConfigured) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await ensureSupabaseProfile(nextUser.id, nextUser.email);
      setProfile(nextProfile);
    } catch (error) {
      console.error('[Vishvakarma.OS] Failed to load profile:', error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  useEffect(() => {
    if (!user || location.pathname !== '/auth') return;
    readAndClearAuthReturnPath();
    navigate(POST_AUTH_DESTINATION, { replace: true });
  }, [user, location.pathname, navigate]);

  const completeEmailLinkSignIn = useCallback(async (email: string) => {
    setEmailLinkError(null);
    setEmailLinkState('completing');
    setLoading(true);

    const result = await completeSupabaseEmailLinkSignIn(email);

    if (result.status === 'completed') {
      setEmailLinkState('idle');
      setLoading(false);
      return { error: null };
    }

    if (result.status === 'error') {
      setEmailLinkState('error');
      setEmailLinkError(result.error.message);
      setLoading(false);
      return { error: result.error };
    }

    setEmailLinkState('needs_email');
    setLoading(false);
    return { error: new Error('Email is required to complete sign-in.') };
  }, []);

  useEffect(() => {
    let mounted = true;
    const authClient = getSupabaseClient();

    if (!backendStatus.isConfigured || !authClient) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const client = authClient;

    const shouldHandleOAuth = isSupabaseOAuthCallback() || isOAuthRedirectPending();
    const shouldHandleEmailLink = isSupabaseEmailLinkCallback();
    let callbackResolutionComplete = false;

    const shouldIgnoreNullSession = (event: string) =>
      event === 'INITIAL_SESSION' &&
      !callbackResolutionComplete &&
      (shouldHandleOAuth || shouldHandleEmailLink);

    async function initAuth() {
      expireStaleOAuthRedirectPending();

      try {
        if (shouldHandleOAuth) {
          const redirectSession = await resolveSupabaseOAuthRedirectSession();
          if (!mounted) return;

          if (redirectSession) {
            const nextUser = supabaseUserFromSession(redirectSession);
            setSession(redirectSession);
            setUser(nextUser);
            setEmailLinkError(null);
            setEmailLinkState('idle');
            markFreshSignIn();
            void loadProfile(nextUser);
          } else if (consumeOAuthRedirectPending() || isSupabaseOAuthCallback()) {
            setEmailLinkError(formatOAuthRedirectIncompleteMessage());
          }
          return;
        }

        if (shouldHandleEmailLink) {
          setEmailLinkState('completing');
          const result = await completeSupabaseEmailLinkSignIn();
          if (!mounted) return;

          if (result.status === 'needs_email') {
            setEmailLinkState('needs_email');
          } else if (result.status === 'error') {
            setEmailLinkState('error');
            setEmailLinkError(result.error.message);
          } else {
            setEmailLinkState('idle');
          }
          return;
        }

        const hydratedSession = await hydrateSupabaseAuthSession();
        if (!mounted) return;

        if (!hydratedSession) {
          return;
        }

        const nextUser = supabaseUserFromSession(hydratedSession);
        setSession(hydratedSession);
        setUser(nextUser);
        void loadProfile(nextUser);
      } catch (error) {
        if (!mounted) return;

        if (shouldHandleOAuth) {
          const message = error instanceof Error ? error.message : formatOAuthRedirectIncompleteMessage();
          setEmailLinkError(formatAuthError(new Error(message)).message);
          consumeOAuthRedirectPending();
        }

        if (shouldHandleEmailLink) {
          setEmailLinkState('error');
          setEmailLinkError(error instanceof Error ? error.message : 'Email-link sign-in failed.');
        }

        console.error('[Vishvakarma.OS] Supabase auth init failed:', error);
      } finally {
        callbackResolutionComplete = true;
        if (mounted) setLoading(false);
      }
    }

    void initAuth();

    const { data: authListener } = client.auth.onAuthStateChange(async (event, authSession) => {
      if (!mounted) return;

      if (!authSession?.user) {
        if (event === 'INITIAL_SESSION' || shouldIgnoreNullSession(event)) {
          return;
        }

        clearSupabaseSessionSnapshot();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextSession = await buildSupabaseSessionFromAuthSession(authSession, authSession.user);
        const nextUser = supabaseUserFromSession(nextSession);

        setSession(nextSession);
        setUser(nextUser);
        setEmailLinkState('idle');
        setEmailLinkError(null);
        if (event === 'SIGNED_IN') {
          markFreshSignIn();
        }
        void loadProfile(nextUser);
      } catch (error) {
        console.error('[Vishvakarma.OS] Supabase auth session sync failed:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const requestAccessLink = useCallback(async (email: string) => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(
          backendStatus.configurationError ??
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
      }

      return await requestSupabaseAccessLink(email, `${window.location.origin}/auth`);
    } catch (error) {
      return { error: normalizeMagicLinkError(error) };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
      }

      const result = await signInWithGoogleSupabase();
      if (result.redirecting) {
        return { error: null, redirecting: true };
      }

      if (result.session) {
        const nextUser = supabaseUserFromSession(result.session);
        setSession(result.session);
        setUser(nextUser);
        markFreshSignIn();
        await loadProfile(nextUser);
      }
      return { error: null };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  }, [loadProfile]);

  const signInWithApple = useCallback(async () => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
      }

      const result = await signInWithAppleSupabase();
      if (result.redirecting) {
        return { error: null, redirecting: true };
      }

      if (result.session) {
        const nextUser = supabaseUserFromSession(result.session);
        setSession(result.session);
        setUser(nextUser);
        markFreshSignIn();
        await loadProfile(nextUser);
      }
      return { error: null };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    clearOAuthRedirectPending();
    await signOutSupabaseAuth();
    setSession(null);
    setUser(null);
    setProfile(null);
    setEmailLinkState('idle');
    setEmailLinkError(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isConfigured: backendStatus.isConfigured,
      mode: backendStatus.mode,
      emailLinkState,
      emailLinkError,
      requestAccessLink,
      completeEmailLinkSignIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
    }),
    [
      emailLinkError,
      emailLinkState,
      loading,
      profile,
      refreshProfile,
      requestAccessLink,
      completeEmailLinkSignIn,
      session,
      signInWithApple,
      signInWithGoogle,
      signOut,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
