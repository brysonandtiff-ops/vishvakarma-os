import { backendStatus } from '@/backend/backendConfig';

const FIREBASE_SEND_OOB_CODE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode';
const FIREBASE_SIGN_IN_WITH_EMAIL_LINK_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink';
const FIREBASE_PENDING_EMAIL_KEY = 'vishvakarma.os.firebase.pendingEmail.v1';
const FIREBASE_SESSION_KEY = 'vishvakarma.os.firebase.session.v1';

interface FirebaseErrorResponse {
  error?: {
    message?: string;
  };
}

interface FirebaseEmailLinkSignInResponse extends FirebaseErrorResponse {
  idToken?: string;
  email?: string;
  refreshToken?: string;
  expiresIn?: string;
  localId?: string;
}

export interface FirebaseSessionSnapshot {
  provider: 'firebase';
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

function getFirebaseApiKey() {
  return import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
}

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeFirebaseAuthError(message: string | undefined) {
  switch (message) {
    case 'EMAIL_NOT_FOUND':
      return new Error('No Firebase account exists for that email. Enable account creation or create the user first.');
    case 'INVALID_EMAIL':
      return new Error('Enter a valid email address.');
    case 'INVALID_OOB_CODE':
    case 'EXPIRED_OOB_CODE':
      return new Error('This Firebase email link is invalid or expired. Request a new secure access link.');
    case 'OPERATION_NOT_ALLOWED':
      return new Error('Firebase email-link sign-in is not enabled. Enable Email/Password and email-link sign-in in Firebase Authentication.');
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new Error('Too many access-link attempts. Try again later.');
    default:
      return new Error(message ? `Firebase auth failed: ${message}` : 'Firebase auth request failed.');
  }
}

function firebaseRequestUrl(baseUrl: string) {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) return null;
  return `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
}

export function writeFirebaseSessionSnapshot(session: FirebaseSessionSnapshot) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(FIREBASE_SESSION_KEY, JSON.stringify(session));
}

export async function buildFirebaseSessionFromIdToken(
  uid: string,
  email: string,
  idToken: string,
  refreshToken = ''
): Promise<FirebaseSessionSnapshot> {
  const session: FirebaseSessionSnapshot = {
    provider: 'firebase',
    uid,
    email,
    idToken,
    refreshToken,
    expiresAt: Date.now() + 3600 * 1000,
  };

  writeFirebaseSessionSnapshot(session);
  return session;
}

export function readFirebaseSessionSnapshot(): FirebaseSessionSnapshot | null {
  if (!hasBrowserStorage()) return null;

  const raw = window.localStorage.getItem(FIREBASE_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<FirebaseSessionSnapshot>;
    if (parsed.provider !== 'firebase') return null;
    if (!parsed.uid || !parsed.email || !parsed.idToken || !parsed.refreshToken || !parsed.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      clearFirebaseSessionSnapshot();
      return null;
    }

    return parsed as FirebaseSessionSnapshot;
  } catch {
    return null;
  }
}

export function clearFirebaseSessionSnapshot() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(FIREBASE_SESSION_KEY);
  window.localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
}

export function isFirebaseEmailLinkCallback(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'signIn' && Boolean(params.get('oobCode'));
}

export async function requestFirebaseAccessLink(email: string, redirectTo: string) {
  if (!backendStatus.isConfigured) {
    return {
      error: new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.'),
    };
  }

  const url = firebaseRequestUrl(FIREBASE_SEND_OOB_CODE_URL);
  if (!url) {
    return { error: new Error('Missing VITE_FIREBASE_API_KEY.') };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'EMAIL_SIGNIN',
        email: normalizedEmail,
        continueUrl: redirectTo,
        canHandleCodeInApp: true,
      }),
    });

    const payload = (await response.json()) as FirebaseErrorResponse;

    if (!response.ok || payload.error) {
      return { error: normalizeFirebaseAuthError(payload.error?.message) };
    }

    if (hasBrowserStorage()) {
      window.localStorage.setItem(FIREBASE_PENDING_EMAIL_KEY, normalizedEmail);
    }

    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: new Error(`Firebase access-link request could not reach Firebase Auth. ${error.message}`),
      };
    }

    return { error: new Error('Firebase access-link request failed for an unknown reason.') };
  }
}

export async function completeFirebaseEmailLinkSignIn(search = typeof window !== 'undefined' ? window.location.search : '') {
  if (!backendStatus.isConfigured) {
    return { session: null, error: null };
  }

  const params = new URLSearchParams(search);
  const oobCode = params.get('oobCode');
  const pendingEmail = hasBrowserStorage() ? window.localStorage.getItem(FIREBASE_PENDING_EMAIL_KEY) : null;

  if (!oobCode) return { session: readFirebaseSessionSnapshot(), error: null };
  if (!pendingEmail) {
    return {
      session: null,
      error: new Error('Firebase email link opened without a saved pending email. Request a new access link from this browser.'),
    };
  }

  const url = firebaseRequestUrl(FIREBASE_SIGN_IN_WITH_EMAIL_LINK_URL);
  if (!url) {
    return { session: null, error: new Error('Missing VITE_FIREBASE_API_KEY.') };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: pendingEmail,
        oobCode,
        returnSecureToken: true,
      }),
    });

    const payload = (await response.json()) as FirebaseEmailLinkSignInResponse;

    if (!response.ok || payload.error || !payload.idToken || !payload.refreshToken || !payload.localId || !payload.email) {
      return { session: null, error: normalizeFirebaseAuthError(payload.error?.message) };
    }

    const expiresInSeconds = Number(payload.expiresIn ?? 3600);
    const session: FirebaseSessionSnapshot = {
      provider: 'firebase',
      uid: payload.localId,
      email: payload.email,
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };

    if (hasBrowserStorage()) {
      writeFirebaseSessionSnapshot(session);
      window.localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
    }

    return { session, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return {
        session: null,
        error: new Error(`Firebase email-link sign-in could not reach Firebase Auth. ${error.message}`),
      };
    }

    return { session: null, error: new Error('Firebase email-link sign-in failed for an unknown reason.') };
  }
}
