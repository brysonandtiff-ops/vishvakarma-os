import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { agentDebugLog } from '@/lib/agentDebugLog';
import { backendStatus } from '@/backend/backendConfig';
import {
  buildSupabaseSessionFromAuthSession,
  clearSupabaseSessionSnapshot,
  completeSupabaseEmailLinkSignIn,
  isSupabaseEmailLinkCallback,
  isSupabaseOAuthCallback,
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

function redirectSignedInUserFromAuth(reason: string) {
  if (typeof window === 'undefined' || window.location.pathname !== '/auth') return false;
  readAndClearAuthReturnPath();
  agentDebugLog({
    location: 'SupabaseAuthProvider.tsx:redirectSignedInUserFromAuth',
    message: 'Hard redirect to editor after sign-in',
    data: { reason, pathname: window.location.pathname },
    hypothesisId: 'J',
  });
  window.location.replace(POST_AUTH_DESTINATION);
  return true;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(backendStatus.isConfigured);
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
    if (loading || !user || location.pathname !== '/auth') return;
    agentDebugLog({
      location: 'SupabaseAuthProvider.tsx:postAuthNavigateEffect',
      message: 'Router navigate to editor from auth',
      data: { loading, hasUser: Boolean(user), pathname: location.pathname },
      hypothesisId: 'D',
    });
    readAndClearAuthReturnPath();
    navigate(POST_AUTH_DESTINATION, { replace: true });
  }, [loading, user, location.pathname, navigate]);

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
    let establishedUserId: string | null = null;

    agentDebugLog({
      location: 'SupabaseAuthProvider.tsx:initAuthStart',
      message: 'Auth init starting',
      data: {
        shouldHandleOAuth,
        shouldHandleEmailLink,
        oauthPending: isOAuthRedirectPending(),
        oauthCallback: isSupabaseOAuthCallback(),
        pathname: typeof window !== 'undefined' ? window.location.pathname : null,
        search: typeof window !== 'undefined' ? window.location.search.slice(0, 80) : null,
      },
      hypothesisId: 'G',
    });

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
            establishedUserId = nextUser.id;
            agentDebugLog({
              location: 'SupabaseAuthProvider.tsx:oauthSessionEstablished',
              message: 'OAuth session established in initAuth',
              data: { uid: nextUser.id },
              hypothesisId: 'A',
            });
            if (redirectSignedInUserFromAuth('initAuth-oauth')) return;
            void loadProfile(nextUser);
          } else if (consumeOAuthRedirectPending()) {
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

        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!mounted || !data.session?.user) return;

        const nextSession = await buildSupabaseSessionFromAuthSession(data.session, data.session.user);
        const nextUser = supabaseUserFromSession(nextSession);
        setSession(nextSession);
        setUser(nextUser);
        establishedUserId = nextUser.id;
        if (redirectSignedInUserFromAuth('initAuth-getSession')) return;
        void loadProfile(nextUser);
      } catch (error) {
        if (!mounted) return;

        if (shouldHandleOAuth && consumeOAuthRedirectPending()) {
          setEmailLinkError(formatOAuthRedirectIncompleteMessage());
        }

        if (shouldHandleEmailLink) {
          setEmailLinkState('error');
          setEmailLinkError(error instanceof Error ? error.message : 'Email-link sign-in failed.');
        }

        console.error('[Vishvakarma.OS] Supabase auth init failed:', error);
      } finally {
        callbackResolutionComplete = true;
        if (mounted) {
          setLoading(false);
          agentDebugLog({
            location: 'SupabaseAuthProvider.tsx:initAuthFinally',
            message: 'Auth init finished',
            data: {
              shouldHandleOAuth,
              shouldHandleEmailLink,
              hasUser: Boolean(establishedUserId),
              establishedUserId,
            },
            hypothesisId: 'B',
          });
        }
      }
    }

    void initAuth();

    const { data: authListener } = client.auth.onAuthStateChange(async (event, authSession) => {
      if (!mounted) return;

      if (!authSession?.user) {
        if (event === 'INITIAL_SESSION') {
          agentDebugLog({
            location: 'SupabaseAuthProvider.tsx:onAuthStateChangeNullInitial',
            message: 'Ignoring INITIAL_SESSION null (Supabase hydration quirk)',
            data: { event, callbackResolutionComplete },
            hypothesisId: 'K',
          });
          return;
        }

        if (shouldIgnoreNullSession(event)) {
          return;
        }

        agentDebugLog({
          location: 'SupabaseAuthProvider.tsx:onAuthStateChangeClearUser',
          message: 'Clearing user from auth state change',
          data: { event },
          hypothesisId: 'K',
        });

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
        agentDebugLog({
          location: 'SupabaseAuthProvider.tsx:onAuthStateChangeSignedIn',
          message: 'Auth state change with user',
          data: { event, uid: nextUser.id, pathname: typeof window !== 'undefined' ? window.location.pathname : null },
          hypothesisId: 'F',
        });
        if (redirectSignedInUserFromAuth(`onAuthStateChange-${event}`)) return;
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
        setSession(result.session);
        setUser(supabaseUserFromSession(result.session));
        await loadProfile(supabaseUserFromSession(result.session));
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
        setSession(result.session);
        setUser(supabaseUserFromSession(result.session));
        await loadProfile(supabaseUserFromSession(result.session));
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
