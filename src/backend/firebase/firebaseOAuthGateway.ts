import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { backendStatus } from '@/backend/backendConfig';
import { firebaseAuth } from '@/backend/firebase/firebaseClient';
import {
  buildFirebaseSessionFromIdToken,
  type FirebaseSessionSnapshot,
} from '@/backend/firebase/firebaseAuthGateway';

async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider) {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.');
  }

  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized.');
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

    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
    // #region agent log
    if (import.meta.env.DEV) fetch('http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e8c938'},body:JSON.stringify({sessionId:'e8c938',location:'firebaseOAuthGateway.ts:signInWithProvider',message:'oauth sign-in error',data:{code,messagePreview:message.slice(0,120)},timestamp:Date.now(),hypothesisId:'H-E'})}).catch(()=>{});
    // #endregion
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
