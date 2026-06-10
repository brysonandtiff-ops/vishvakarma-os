import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type AuthError,
} from 'firebase/auth';
import { backendStatus } from '@/backend/backendConfig';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';
import {
  buildFirebaseSessionFromIdToken,
  type FirebaseSessionSnapshot,
} from '@/backend/firebase/firebaseAuthGateway';

export type OAuthSignInResult = {
  session: FirebaseSessionSnapshot | null;
  redirecting: boolean;
};

export function formatAuthError(error: unknown): Error {
  const authError = error as AuthError;
  const code = authError?.code ?? '';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'auth/unauthorized-domain') {
    return new Error(
      'This site domain is not authorized in Firebase. Add vishvakarma-os.vercel.app under Authentication → Settings → Authorized domains.'
    );
  }
  if (code === 'auth/operation-not-allowed') {
    return new Error(
      'Google sign-in is not enabled for this Firebase project. Enable Google under Authentication → Sign-in method.'
    );
  }
  if (code === 'auth/internal-error') {
    return new Error(
      'Google sign-in could not open securely in this browser. Retrying with a full-page redirect…'
    );
  }
  if (message.includes('redirect_uri_mismatch')) {
    return new Error(
      'Google OAuth redirect URI mismatch. Ensure https://gen-lang-client-0690161780.firebaseapp.com/__/auth/handler is registered on the Firebase OAuth web client.'
    );
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error('Google sign-in was cancelled. Try again when ready.');
  }

  return error instanceof Error ? error : new Error(message);
}

export function isWebKitBrowser(userAgent: string): boolean {
  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (/Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox/i.test(userAgent))
  );
}

function shouldPreferRedirectFlow() {
  if (typeof window === 'undefined') {
    return false;
  }

  // Popup OAuth is unreliable on production hosts, Safari, and tablet browsers.
  if (import.meta.env.PROD) {
    return true;
  }

  const userAgent = navigator.userAgent;
  if (isWebKitBrowser(userAgent)) {
    return true;
  }

  return /iPad|iPhone|iPod|Android|Mobile/i.test(userAgent);
}

function shouldFallbackToRedirect(error: unknown) {
  const authError = error as AuthError;
  const code = authError?.code ?? '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    code === 'auth/internal-error' ||
    code === 'auth/popup-blocked' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup') ||
    message.includes('blocked') ||
    message.includes('cross-origin')
  );
}

async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider): Promise<OAuthSignInResult> {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }

  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  if (shouldPreferRedirectFlow()) {
    try {
      await signInWithRedirect(firebaseAuth, provider);
    } catch (error) {
      throw formatAuthError(error);
    }
    return { session: null, redirecting: true };
  }

  try {
    const credential = await signInWithPopup(firebaseAuth, provider);
    const user = credential.user;
    const idToken = await user.getIdToken();

    const session = await buildFirebaseSessionFromIdToken(
      user.uid,
      user.email ?? '',
      idToken
    );

    return { session, redirecting: false };
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      await signInWithRedirect(firebaseAuth, provider);
      return { session: null, redirecting: true };
    }

    throw formatAuthError(error);
  }
}

export async function signInWithGoogleFirebase() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithProvider(provider);
}

export async function signInWithAppleFirebase() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return signInWithProvider(provider);
}
