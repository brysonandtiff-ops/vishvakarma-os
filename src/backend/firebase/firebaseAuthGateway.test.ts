import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildFirebaseSessionFromIdToken,
  clearFirebaseSessionSnapshot,
  readFirebaseSessionSnapshot,
  requestFirebaseAccessLink,
  resolveFirebaseSessionForFirestore,
} from './firebaseAuthGateway';

const storage = new Map<string, string>();

vi.mock('@/backend/backendConfig', () => ({
  backendStatus: { isConfigured: true, mode: 'connected' as const },
}));

const sendSignInLinkToEmail = vi.fn();

vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: vi.fn(() => false),
  sendSignInLinkToEmail: (...args: unknown[]) => sendSignInLinkToEmail(...args),
  signInWithEmailLink: vi.fn(),
}));

vi.mock('@/backend/firebase/firebaseClient', () => ({
  firebaseAuth: {
    currentUser: null as null | { uid: string; email: string; getIdToken: (force?: boolean) => Promise<string> },
  },
}));

import { firebaseAuth } from '@/backend/firebase/firebaseClient';

describe('firebaseAuthGateway session snapshot', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
    clearFirebaseSessionSnapshot();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearFirebaseSessionSnapshot();
    sendSignInLinkToEmail.mockReset();
  });

  it('persists SDK-backed sessions without a REST refresh token', async () => {
    await buildFirebaseSessionFromIdToken('uid-1', 'architect@firm.com', 'token-abc');

    const snapshot = readFirebaseSessionSnapshot();
    expect(snapshot).toMatchObject({
      uid: 'uid-1',
      email: 'architect@firm.com',
      idToken: 'token-abc',
      refreshToken: 'sdk',
    });
  });

  it('refreshes Firestore bearer tokens from the Firebase SDK user', async () => {
    const getIdToken = vi.fn().mockResolvedValue('fresh-token');
    firebaseAuth.currentUser = {
      uid: 'uid-2',
      email: 'builder@firm.com',
      getIdToken,
    };

    const session = await resolveFirebaseSessionForFirestore();

    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(session.idToken).toBe('fresh-token');
    expect(readFirebaseSessionSnapshot()?.idToken).toBe('fresh-token');
  });

  it('returns null for expired snapshots without clearing SDK auth state', async () => {
    storage.set(
      'vishvakarma.os.firebase.session.v1',
      JSON.stringify({
        provider: 'firebase',
        uid: 'uid-3',
        email: 'expired@firm.com',
        idToken: 'old-token',
        refreshToken: 'sdk',
        expiresAt: Date.now() - 1000,
      })
    );

    expect(readFirebaseSessionSnapshot()).toBeNull();
  });

  it('maps QUOTA_EXCEEDED to a user-facing email quota message', async () => {
    sendSignInLinkToEmail.mockRejectedValue({ code: 'auth/quota-exceeded' });

    const result = await requestFirebaseAccessLink('architect@firm.com', 'https://vishvakarma-os.vercel.app/auth');

    expect(result.error?.message).toBe(
      'Daily email sign-in limit reached. Use Continue with Google, or try email again tomorrow.'
    );
  });
});
