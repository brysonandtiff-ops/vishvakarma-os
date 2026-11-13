import { getSupabaseClient } from '@/backend/supabase/supabaseClient';
import { getCurrentSupabaseUserId } from '@/backend/supabase/supabaseUserIdentity';

const MAX_TEXTURE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MATERIALS_BUCKET = 'materials';

export function isStorageConfigured(): boolean {
  return Boolean(getSupabaseClient());
}

export async function uploadMaterialTexture(file: File, userId: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase Storage is not configured');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Texture must be PNG, JPEG, or WebP');
  }
  if (file.size > MAX_TEXTURE_BYTES) {
    throw new Error('Texture must be 2 MB or smaller');
  }

  const currentUserId = await getCurrentSupabaseUserId(client);
  if (!currentUserId || currentUserId !== userId) {
    throw new Error('Supabase session is not available for this upload.');
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from(MATERIALS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = client.storage.from(MATERIALS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
