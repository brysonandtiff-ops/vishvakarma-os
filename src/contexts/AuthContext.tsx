import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { backendStatus } from '@/backend/backendConfig';
import {
  buildFirebaseSessionFromIdToken,
  clearFirebaseSessionSnapshot,
  completeFirebaseEmailLinkSignIn,
  readFirebaseSessionSnapshot,
  requestFirebaseAccessLink,
  type FirebaseSessionSnapshot,
} from '@/backend/firebase/firebaseAuthGateway';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';
import { signInWithAppleFirebase, signInWithGoogleFirebase } from '@/backend/firebase/firebaseOAuthGateway';
import { ensureFirestoreProfile, getFirestoreProfile } from '@/backend/firebase/firestoreProfileGateway';
import type { Profile } from '@/types';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

type FirebaseAuthUser = {
  id: string;
  email: string;
  provider: 'firebase';
};

type AuthUser = FirebaseAuthUser;
type AuthSession = FirebaseSessionSnapshot;

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

async function syncSessionFromFirebaseUser(uid: string, email: string, idToken: string) {
  return buildFirebaseSessionFromIdToken(uid, email, idToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(backendStatus.isConfigured);

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

  useEffect(() => {
    let mounted = true;

    if (!backendStatus.isConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    completeFirebaseEmailLinkSignIn()
      .then(async ({ session: emailLinkSession, error }) => {
        if (!mounted) return;
        if (error) throw error;

        if (emailLinkSession) {
          setSession(emailLinkSession);
          setUser(firebaseUserFromSession(emailLinkSession));
          await loadProfile(firebaseUserFromSession(emailLinkSession));
        }
      })
      .catch((error) => {
        console.error('[Vishvakarma.OS] Firebase email-link sign-in failed:', error);
      });

    if (!firebaseAuth) {
      const restoredSession = readFirebaseSessionSnapshot();
      if (mounted) {
        setSession(restoredSession);
        setUser(restoredSession ? firebaseUserFromSession(restoredSession) : null);
        void loadProfile(restoredSession ? firebaseUserFromSession(restoredSession) : null);
        setLoading(false);
      }

      return () => {
        mounted = false;
      };
    }

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
        const idToken = await firebaseUser.getIdToken();
        const nextSession = await syncSessionFromFirebaseUser(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          idToken
        );
        const nextUser = firebaseUserFromSession(nextSession);

        setSession(nextSession);
        setUser(nextUser);
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

      const nextSession = await signInWithGoogleFirebase();
      if (nextSession) {
        setSession(nextSession);
        setUser(firebaseUserFromSession(nextSession));
        await loadProfile(firebaseUserFromSession(nextSession));
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Google sign-in failed.') };
    }
  }, [loadProfile]);

  const signInWithApple = useCallback(async () => {
    try {
      if (!backendStatus.isConfigured) {
        throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
      }

      const nextSession = await signInWithAppleFirebase();
      if (nextSession) {
        setSession(nextSession);
        setUser(firebaseUserFromSession(nextSession));
        await loadProfile(firebaseUserFromSession(nextSession));
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Apple sign-in failed.') };
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
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isConfigured: backendStatus.isConfigured,
      mode: backendStatus.mode,
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
