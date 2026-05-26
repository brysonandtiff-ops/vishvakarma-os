import { backendStatus } from '@/backend/backendConfig';

const FIREBASE_SEND_OOB_CODE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode';

interface FirebaseSendOobResponse {
  email?: string;
  error?: {
    message?: string;
  };
}

function getFirebaseApiKey() {
  return import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
}

function normalizeFirebaseAuthError(message: string | undefined) {
  switch (message) {
    case 'EMAIL_NOT_FOUND':
      return new Error('No Firebase account exists for that email. Enable account creation or create the user first.');
    case 'INVALID_EMAIL':
      return new Error('Enter a valid email address.');
    case 'OPERATION_NOT_ALLOWED':
      return new Error('Firebase email-link sign-in is not enabled. Enable Email/Password and email-link sign-in in Firebase Authentication.');
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new Error('Too many access-link attempts. Try again later.');
    default:
      return new Error(message ? `Firebase auth failed: ${message}` : 'Firebase auth request failed.');
  }
}

export async function requestFirebaseAccessLink(email: string, redirectTo: string) {
  if (!backendStatus.isConfigured || backendStatus.provider !== 'firebase') {
    return {
      error: new Error(backendStatus.configurationError ?? 'Firebase backend is not configured.'),
    };
  }

  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return { error: new Error('Missing VITE_FIREBASE_API_KEY.') };
  }

  try {
    const response = await fetch(`${FIREBASE_SEND_OOB_CODE_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'EMAIL_SIGNIN',
        email: email.trim().toLowerCase(),
        continueUrl: redirectTo,
        canHandleCodeInApp: true,
      }),
    });

    const payload = (await response.json()) as FirebaseSendOobResponse;

    if (!response.ok || payload.error) {
      return { error: normalizeFirebaseAuthError(payload.error?.message) };
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
