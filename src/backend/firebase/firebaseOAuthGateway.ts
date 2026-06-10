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

type AuthErrorContext = {
  usedRedirect?: boolean;
};

const OAUTH_REDIRECT_PENDING_KEY = 'vish-oauth-redirect-pending';

export function markOAuthRedirectPending() {
  try {
    sessionStorage.setItem(OAUTH_REDIRECT_PENDING_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
}

export function clearOAuthRedirectPending() {
  try {
    sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
  } catch {
    // ignore storage failures
  }
}

export function consumeOAuthRedirectPending(maxAgeMs = 120_000): boolean {
  try {
    const raw = sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY);
    sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
    if (!raw) {
      return false;
    }

    const started = Number(raw);
    return Number.isFinite(started) && Date.now() - started < maxAgeMs;
  } catch {
    return false;
  }
}

export function formatAuthError(error: unknown, context: AuthErrorContext = {}): Error {
  const authError = error as AuthError;
  const code = authError?.code ?? '';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'auth/unauthorized-domain') {
    const host =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'this deployment host';
    return new Error(
      `This site domain is not authorized in Firebase. Add ${host} under Authentication → Settings → Authorized domains, or run: pnpm run setup:firebase-auth -- --add-domain ${host}`
    );
  }
  if (code === 'auth/operation-not-allowed') {
    return new Error(
      'Google sign-in is not enabled for this Firebase project. Enable Google under Authentication → Sign-in method.'
    );
  }
  if (code === 'auth/internal-error') {
    const host =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'this deployment host';
    return new Error(
      `Google sign-in could not complete in this browser. Use Chrome or Safari (not an embedded IDE preview), allow cookies, and add ${host} under Firebase Authentication → Authorized domains.`
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

export function shouldPreferRedirectFlow() {
  if (typeof window === 'undefined') {
    return false;
  }

  // Popup OAuth is unreliable in production, Safari, tablets, and embedded IDE browsers.
  return true;
}

export function isEmbeddedAuthBrowser(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  // Do not match HeadlessChrome — Playwright and CI browsers use it; only block IDE embedded previews.
  return /Cursor|Electron|VSCode/i.test(userAgent);
}

function formatEmbeddedBrowserError(): Error {
  const url = typeof window !== 'undefined' ? window.location.href : '/auth';
  return new Error(
    `Google sign-in does not work in embedded IDE browsers (Cursor, VS Code). Open this page in Chrome or Safari: ${url}`
  );
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

  if (isEmbeddedAuthBrowser()) {
    throw formatEmbeddedBrowserError();
  }

  const preferRedirect = shouldPreferRedirectFlow();

  if (preferRedirect) {
    try {
      markOAuthRedirectPending();
      await signInWithRedirect(firebaseAuth, provider);
    } catch (error) {
      clearOAuthRedirectPending();
      throw formatAuthError(error, { usedRedirect: true });
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
      try {
        markOAuthRedirectPending();
        await signInWithRedirect(firebaseAuth, provider);
      } catch (redirectError) {
        clearOAuthRedirectPending();
        throw formatAuthError(redirectError, { usedRedirect: true });
      }
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
