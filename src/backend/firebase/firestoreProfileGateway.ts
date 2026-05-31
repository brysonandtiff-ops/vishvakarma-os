import type { Profile } from '@/types';
import {
  createFirestoreDocument,
  documentToRecord,
  getFirestoreDocument,
  updateFirestoreDocument,
} from './firestoreRestClient';

const PROFILES_COLLECTION = 'profiles';

export async function getFirestoreProfile(userId: string): Promise<Profile | null> {
  const document = await getFirestoreDocument(PROFILES_COLLECTION, userId);
  if (!document) return null;
  return documentToRecord<Profile>(document);
}

export async function ensureFirestoreProfile(userId: string, email: string): Promise<Profile> {
  const existing = await getFirestoreProfile(userId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const profile: Record<string, unknown> = {
    id: userId,
    email,
    full_name: email.split('@')[0] ?? 'Architect',
    role: 'user',
    ownerId: userId,
    created_at: now,
    updated_at: now,
  };

  const document = await createFirestoreDocument(PROFILES_COLLECTION, userId, profile);
  return documentToRecord<Profile>(document);
}

export async function updateFirestoreProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile> {
  const existing = await getFirestoreProfile(userId);
  if (!existing) {
    throw new Error(`Profile not found: ${userId}`);
  }

  const updated: Record<string, unknown> = {
    ...existing,
    ...updates,
    id: userId,
    ownerId: userId,
    updated_at: new Date().toISOString(),
  };

  const document = await updateFirestoreDocument(PROFILES_COLLECTION, userId, updated);
  return documentToRecord<Profile>(document);
}
