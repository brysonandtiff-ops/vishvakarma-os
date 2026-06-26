import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

test.describe('Supabase cloud project lifecycle proof', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY,
      'Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    );
  });

  test('create → read → update → delete project row', async () => {
    const supabase = getSupabaseClient();
    expect(supabase, 'Supabase client should be configured').not.toBeNull();

    const id = `e2e_${Date.now()}`;

    // CREATE
    const created = await supabase!
      .from('projects')
      .insert({ id, name: 'E2E Cloud Project', status: 'test' })
      .select('*');

    expect(created.error, 'create should succeed').toBeNull();

    // READ
    const read = await supabase.from('projects').select('*').eq('id', id).single();

    expect(read.error).toBeNull();
    expect(read.data?.id).toBe(id);

    // UPDATE
    const updated = await supabase
      .from('projects')
      .update({ name: 'E2E Updated Project' })
      .eq('id', id)
      .select('*');

    expect(updated.error).toBeNull();

    // VERIFY UPDATE
    const verify = await supabase.from('projects').select('*').eq('id', id).single();
    expect(verify.data?.name).toBe('E2E Updated Project');

    // DELETE
    const deleted = await supabase.from('projects').delete().eq('id', id);

    expect(deleted.error).toBeNull();

    // FINAL VERIFY (should be null or empty)
    const finalCheck = await supabase.from('projects').select('*').eq('id', id);
    expect(finalCheck.data?.length ?? 0).toBe(0);
  });
});