import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { backendStatus } from '@/backend/backendConfig';
import {
  buildFirebaseSessionFromIdToken,
  clearFirebaseSessionSnapshot,
  completeFirebaseEmailLinkSignIn,
  isFirebaseEmailLinkCallback,
  requestFirebaseAccessLink,
  type FirebaseSessionSnapshot,
} from '@/backend/firebase/firebaseAuthGateway';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';
import {
  clearOAuthRedirectPending,
  consumeOAuthRedirectPending,
  formatAuthError,
  signInWithAppleFirebase,
  signInWithGoogleFirebase,
} from '@/backend/firebase/firebaseOAuthGateway';
import { ensureFirestoreProfile, getFirestoreProfile } from '@/backend/firebase/firestoreProfileGateway';
import type { Profile } from '@/types';
import { onAuthStateChanged, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';

type FirebaseAuthUser = {
  id: string;
  email: string;
  provider: 'firebase';
};

type AuthUser = FirebaseAuthUser;
type AuthSession = FirebaseSessionSnapshot;

export type EmailLinkState = 'idle' | 'completing' | 'needs_email' | 'error';

interface AuthContextType {
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
      return new Error(
        'Magic-link request could not reach Firebase Auth. Check Firebase environment variables and deployment network access.'
      );
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!backendStatus.isConfigured) return null;

  try {
    return await getFirestoreProfile(userId);
  } catch (error) {
    console.error('[Vishvakarma.OS] Failed to fetch user profile:', error);
    return null;
  }
}

async function syncSessionFromFirebaseUser(uid: string, email: string, forceRefresh = false) {
  if (!firebaseAuth?.currentUser) {
    throw new Error('Firebase user is not available.');
  }

  const idToken = await firebaseAuth.currentUser.getIdToken(forceRefresh);
  return buildFirebaseSessionFromIdToken(uid, firebaseAuth.currentUser.email ?? email, idToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
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
      const nextProfile = await ensureFirestoreProfile(nextUser.id, nextUser.email);
      setProfile(nextProfile);
    } catch (error) {
      console.error('[Vishvakarma.OS] Failed to load profile:', error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  const completeEmailLinkSignIn = useCallback(async (email: string) => {
    setEmailLinkError(null);
    setEmailLinkState('completing');
    setLoading(true);

    const result = await completeFirebaseEmailLinkSignIn(email);

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

    if (!backendStatus.isConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!firebaseAuth) {
      if (mounted) setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (isFirebaseEmailLinkCallback()) {
      setEmailLinkState('completing');
      void completeFirebaseEmailLinkSignIn()
        .then((result) => {
          if (!mounted) return;

          if (result.status === 'needs_email') {
            setEmailLinkState('needs_email');
            setLoading(false);
            return;
          }

          if (result.status === 'error') {
            setEmailLinkState('error');
            setEmailLinkError(result.error.message);
            setLoading(false);
            console.error('[Vishvakarma.OS] Firebase email-link sign-in failed:', result.error);
            return;
          }

          if (result.status === 'completed') {
            setEmailLinkState('idle');
            setLoading(false);
          }
        })
        .catch((error) => {
          if (!mounted) return;
          setEmailLinkState('error');
          setEmailLinkError(error instanceof Error ? error.message : 'Email-link sign-in failed.');
          setLoading(false);
          console.error('[Vishvakarma.OS] Firebase email-link sign-in failed:', error);
        });
    }

    void getRedirectResult(firebaseAuth)
      .then(async (credential) => {
        if (!mounted) {
          return;
        }

        if (!credential?.user) {
          if (consumeOAuthRedirectPending() && mounted) {
            setEmailLinkError(
              'Google sign-in could not finish in this browser. Open this page in Chrome or Safari (not the Cursor embedded preview), then try again.'
            );
          }
          return;
        }

        clearOAuthRedirectPending();

        try {
          const nextSession = await syncSessionFromFirebaseUser(
            credential.user.uid,
            credential.user.email ?? '',
            true
          );
          const nextUser = firebaseUserFromSession(nextSession);

          setSession(nextSession);
          setUser(nextUser);
          setEmailLinkState('idle');
          setEmailLinkError(null);
          await loadProfile(nextUser);
        } catch (error) {
          console.error('[Vishvakarma.OS] Firebase OAuth redirect sign-in failed:', error);
          if (mounted) {
            setEmailLinkError(formatAuthError(error, { usedRedirect: true }).message);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      })
      .catch((error) => {
        if (!mounted) return;
        const code = (error as { code?: string })?.code ?? '';
        clearOAuthRedirectPending();
        if (code === 'auth/no-auth-event') {
          setLoading(false);
          return;
        }
        console.error('[Vishvakarma.OS] Firebase OAuth redirect result failed:', error);
        setEmailLinkError(formatAuthError(error, { usedRedirect: true }).message);
        setLoading(false);
      });

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!mounted) return;

      if (!firebaseUser) {
        clearFirebaseSessionSnapshot();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextSession = await syncSessionFromFirebaseUser(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          true
        );
        const nextUser = firebaseUserFromSession(nextSession);

        setSession(nextSession);
        setUser(nextUser);
        setEmailLinkState('idle');
        setEmailLinkError(null);
        await loadProfile(nextUser);
      } catch (error) {
        console.error('[Vishvakarma.OS] Firebase auth session sync failed:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const requestAccessLink = useCallback(async (email: string) => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(
          backendStatus.configurationError ??
            'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
        );
      }

      return await requestFirebaseAccessLink(email, `${window.location.origin}/auth`);
    } catch (error) {
      return { error: normalizeMagicLinkError(error) };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
      }

      const result = await signInWithGoogleFirebase();
      if (result.redirecting) {
        return { error: null, redirecting: true };
      }

      if (result.session) {
        setSession(result.session);
        setUser(firebaseUserFromSession(result.session));
        await loadProfile(firebaseUserFromSession(result.session));
      }
      return { error: null };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  }, [loadProfile]);

  const signInWithApple = useCallback(async () => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
      }

      const result = await signInWithAppleFirebase();
      if (result.redirecting) {
        return { error: null, redirecting: true };
      }

      if (result.session) {
        setSession(result.session);
        setUser(firebaseUserFromSession(result.session));
        await loadProfile(firebaseUserFromSession(result.session));
      }
      return { error: null };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    } else {
      clearFirebaseSessionSnapshot();
    }

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
