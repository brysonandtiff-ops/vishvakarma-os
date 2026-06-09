import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseApp, isFirebaseConfigured } from '@/backend/firebase/firebaseClient';

const MAX_TEXTURE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export function isStorageConfigured(): boolean {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  return isFirebaseConfigured && typeof bucket === 'string' && bucket.trim().length > 0 && Boolean(firebaseApp);
}

export async function uploadMaterialTexture(file: File, userId: string): Promise<string> {
  if (!isStorageConfigured() || !firebaseApp) {
    throw new Error('Firebase Storage is not configured');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Texture must be PNG, JPEG, or WebP');
  }
  if (file.size > MAX_TEXTURE_BYTES) {
    throw new Error('Texture must be 2 MB or smaller');
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const storage = getStorage(firebaseApp);
  const path = `materials/${userId}/${crypto.randomUUID()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
