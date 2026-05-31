import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { backendStatus } from '@/backend/backendConfig';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';
import type { FirebaseSessionSnapshot } from '@/backend/firebase/firebaseAuthGateway';

const FIREBASE_SESSION_KEY = 'vishvakarma.os.firebase.session.v1';

async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider) {
  if (!backendStatus.isConfigured || backendStatus.provider !== 'firebase') {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }

  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    const credential = await signInWithPopup(firebaseAuth, provider);
    const user = credential.user;
    const idToken = await user.getIdToken();

    const session: FirebaseSessionSnapshot = {
      provider: 'firebase',
      uid: user.uid,
      email: user.email ?? '',
      idToken,
      refreshToken: '',
      expiresAt: Date.now() + 3600 * 1000,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FIREBASE_SESSION_KEY, JSON.stringify(session));
    }

    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('popup') || message.includes('blocked')) {
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    }
    throw error;
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
