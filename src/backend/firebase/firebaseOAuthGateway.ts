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

const DEBUG_LOG_KEY = 'vish-debug-d4817d';

function persistOAuthDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  const entry = {
    sessionId: 'd4817d',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem(DEBUG_LOG_KEY) ?? '[]') as unknown[];
    const next = Array.isArray(existing) ? [...existing, entry].slice(-20) : [entry];
    window.localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures
  }

  // #region agent log
  fetch('http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd4817d' },
    body: JSON.stringify(entry),
  }).catch(() => {});
  // #endregion
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

function isEmbeddedBrowser(userAgent: string) {
  return /Cursor|Electron|VSCode|HeadlessChrome/i.test(userAgent);
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

  const preferRedirect = shouldPreferRedirectFlow();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  persistOAuthDebugLog(
    'firebaseOAuthGateway.ts:signInWithProvider',
    'oauth flow start',
    {
      preferRedirect,
      isProd: import.meta.env.PROD,
      host: window.location.hostname,
      embedded: isEmbeddedBrowser(userAgent),
    },
    'A'
  );

  if (preferRedirect) {
    try {
      await signInWithRedirect(firebaseAuth, provider);
    } catch (error) {
      const authError = error as AuthError;
      persistOAuthDebugLog(
        'firebaseOAuthGateway.ts:redirect',
        'redirect sign-in failed',
        { code: authError?.code ?? '', message: error instanceof Error ? error.message : String(error) },
        'B'
      );
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
    const authError = error as AuthError;
    // #region agent log
    fetch('http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d4817d'},body:JSON.stringify({sessionId:'d4817d',location:'firebaseOAuthGateway.ts:popup',message:'popup sign-in failed',data:{code:authError?.code??'',willFallback:shouldFallbackToRedirect(error)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (shouldFallbackToRedirect(error)) {
      try {
        await signInWithRedirect(firebaseAuth, provider);
      } catch (redirectError) {
        const redirectAuthError = redirectError as AuthError;
        // #region agent log
        fetch('http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d4817d'},body:JSON.stringify({sessionId:'d4817d',location:'firebaseOAuthGateway.ts:popup-fallback',message:'redirect fallback failed',data:{popupCode:authError?.code??'',redirectCode:redirectAuthError?.code??''},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
