import { getSupabaseClient } from '@/backend/supabase/supabaseClient';
import { readSupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';

const MAX_TEXTURE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MATERIALS_BUCKET = 'materials';

export function isStorageConfigured(): boolean {
  const client = getSupabaseClient();
  return Boolean(client && readSupabaseSessionSnapshot()?.uid);
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

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from(MATERIALS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = client.storage.from(MATERIALS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
