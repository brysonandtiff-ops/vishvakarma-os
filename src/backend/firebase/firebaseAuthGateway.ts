import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from 'firebase/auth';
import { backendStatus } from '@/backend/backendConfig';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';

/** Legacy REST endpoints — retained for auth-config guard and operator docs. */
const FIREBASE_SEND_OOB_CODE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode';
const FIREBASE_SIGN_IN_WITH_EMAIL_LINK_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink';

const FIREBASE_PENDING_EMAIL_KEY = 'vishvakarma.os.firebase.pendingEmail.v1';
const FIREBASE_SESSION_KEY = 'vishvakarma.os.firebase.session.v1';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface FirebaseSessionSnapshot {
  provider: 'firebase';
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeFirebaseAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : undefined;

  const code = message?.replace('auth/', '') ?? '';

  switch (code) {
    case 'EMAIL_NOT_FOUND':
      return new Error('No Firebase account exists for that email. Enable account creation or create the user first.');
    case 'INVALID_EMAIL':
      return new Error('Enter a valid email address.');
    case 'INVALID_OOB_CODE':
    case 'EXPIRED_OOB_CODE':
      return new Error('This Firebase email link is invalid or expired. Request a new secure access link.');
    case 'OPERATION_NOT_ALLOWED':
      return new Error(
        'Firebase email-link sign-in is not enabled. Enable Email/Password and email-link sign-in in Firebase Authentication.'
      );
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new Error('Too many access-link attempts. Try again later.');
    default:
      return new Error(message ? `Firebase auth failed: ${message}` : 'Firebase auth request failed.');
  }
}

export function writeFirebaseSessionSnapshot(session: FirebaseSessionSnapshot) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(FIREBASE_SESSION_KEY, JSON.stringify(session));
}

export async function buildFirebaseSessionFromIdToken(
  uid: string,
  email: string,
  idToken: string,
  refreshToken = 'sdk'
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
    if (!parsed.uid || !parsed.email || !parsed.idToken || !parsed.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      return null;
    }

    return {
      provider: 'firebase',
      uid: parsed.uid,
      email: parsed.email,
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken ?? 'sdk',
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function clearFirebaseSessionSnapshot() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(FIREBASE_SESSION_KEY);
  window.localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
}

export function readPendingEmailForSignIn() {
  if (!hasBrowserStorage()) return null;
  return window.localStorage.getItem(FIREBASE_PENDING_EMAIL_KEY);
}

export function writePendingEmailForSignIn(email: string) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(FIREBASE_PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function clearPendingEmailForSignIn() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(FIREBASE_PENDING_EMAIL_KEY);
}

export function isFirebaseEmailLinkCallback(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'signIn' && Boolean(params.get('oobCode'));
}

export function needsEmailForEmailLinkCallback() {
  if (!isFirebaseEmailLinkCallback()) return false;
  return !readPendingEmailForSignIn();
}

function getEmailLinkUrl(redirectTo: string) {
  return redirectTo.endsWith('/auth') ? redirectTo : `${redirectTo.replace(/\/$/, '')}/auth`;
}

export async function requestFirebaseAccessLink(email: string, redirectTo: string) {
  if (!backendStatus.isConfigured) {
    return {
      error: new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.'),
    };
  }

  if (!firebaseAuth) {
    return { error: new Error('Firebase Auth is not initialized.') };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await sendSignInLinkToEmail(firebaseAuth, normalizedEmail, {
      url: getEmailLinkUrl(redirectTo),
      handleCodeInApp: true,
    });

    writePendingEmailForSignIn(normalizedEmail);
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('networkerror')) {
        return {
          error: new Error(`Firebase access-link request could not reach Firebase Auth. ${error.message}`),
        };
      }
    }

    return { error: normalizeFirebaseAuthError(error) };
  }
}

export type EmailLinkSignInResult =
  | { status: 'idle' }
  | { status: 'needs_email' }
  | { status: 'completed' }
  | { status: 'error'; error: Error };

export async function completeFirebaseEmailLinkSignIn(
  email?: string,
  emailLink = typeof window !== 'undefined' ? window.location.href : ''
): Promise<EmailLinkSignInResult> {
  if (!backendStatus.isConfigured || !firebaseAuth) {
    return { status: 'idle' };
  }

  if (!isSignInWithEmailLink(firebaseAuth, emailLink)) {
    return { status: 'idle' };
  }

  const pendingEmail = email?.trim().toLowerCase() || readPendingEmailForSignIn();
  if (!pendingEmail) {
    return { status: 'needs_email' };
  }

  try {
    await signInWithEmailLink(firebaseAuth, pendingEmail, emailLink);
    clearPendingEmailForSignIn();

    if (typeof window !== 'undefined') {
      const cleanUrl = `${window.location.origin}/auth`;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    return { status: 'completed' };
  } catch (error) {
    return { status: 'error', error: normalizeFirebaseAuthError(error) };
  }
}

export async function resolveFirebaseSessionForFirestore(): Promise<FirebaseSessionSnapshot> {
  if (firebaseAuth?.currentUser) {
    const currentUser = firebaseAuth.currentUser;
    const existing = readFirebaseSessionSnapshot();
    const shouldForceRefresh =
      !existing ||
      existing.uid !== currentUser.uid ||
      Date.now() >= existing.expiresAt - TOKEN_REFRESH_BUFFER_MS;

    const idToken = await currentUser.getIdToken(shouldForceRefresh);
    return buildFirebaseSessionFromIdToken(currentUser.uid, currentUser.email ?? '', idToken);
  }

  const snapshot = readFirebaseSessionSnapshot();
  if (snapshot) {
    return snapshot;
  }

  throw new Error('Firebase session is missing. Sign in again before using Firestore.');
}

// Exported for auth-config guard checks.
export const FIREBASE_AUTH_REST_ENDPOINTS = {
  sendOobCode: FIREBASE_SEND_OOB_CODE_URL,
  signInWithEmailLink: FIREBASE_SIGN_IN_WITH_EMAIL_LINK_URL,
};
