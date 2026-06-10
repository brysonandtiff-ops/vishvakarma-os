import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const isFirebaseConfigured =
  hasValue(apiKey) && hasValue(authDomain) && hasValue(projectId) && hasValue(appId);

const firebaseConfig: FirebaseEnvConfig | null = isFirebaseConfigured
  ? {
      apiKey: apiKey as string,
      authDomain: authDomain as string,
      projectId: projectId as string,
      storageBucket: hasValue(storageBucket) ? storageBucket : undefined,
      messagingSenderId: hasValue(messagingSenderId) ? messagingSenderId : undefined,
      appId: appId as string,
    }
  : null;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

if (firebaseConfig) {
  firebaseApp = initializeApp(firebaseConfig);
  try {
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    firebaseAuth = getAuth(firebaseApp);
  }
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7686/ingest/cdb0a854-0724-4d15-96cb-d25c2ef763fe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '83489a' },
      body: JSON.stringify({
        sessionId: '83489a',
        runId: 'pre-fix',
        hypothesisId: 'E',
        location: 'firebaseClient.ts:init',
        message: 'Firebase client initialized',
        data: {
          hostname: window.location.hostname,
          origin: window.location.origin,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          isProd: import.meta.env.PROD,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
} else {
  console.warn(
    '[Vishvakarma.OS] Firebase is not configured. Auth is running in local-only mode. ' +
      'Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to enable secure sign-in.'
  );
}

export { firebaseApp, firebaseAuth };
