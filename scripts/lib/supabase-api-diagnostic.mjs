import { createHash } from 'node:crypto';

/**
 * PRIVILEGED DIAGNOSTIC ONLY. The service role bypasses normal end-user RLS.
 * Successful results are never evidence of authenticated browser CRUD.
 *
 * An insert must be followed by a verified cleanup even when validation,
 * subsequent selects or updates fail.
 */
export async function runServiceRoleProjectDiagnostic({
  client,
  sample,
  userId,
  record,
  now = () => new Date().toISOString(),
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId ?? '')) {
    record('api: dedicated diagnostic user required', false, 'Invalid or absent test user ID');
    return false;
  }

  let insertedId = null;
  let bodyPassed = false;
  let cleanupPassed = false;
  const fingerprint = (model) => ({
    walls: model?.walls?.length ?? 0,
    openings: model?.openings?.length ?? 0,
    hash: createHash('sha256').update(JSON.stringify(model)).digest('hex').slice(0, 12),
  });

  try {
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .limit(1);
    if (profileError || profiles?.length !== 1 || profiles[0]?.id !== userId) {
      throw new Error(`Dedicated test user unavailable: ${profileError?.message ?? 'profile not found'}`);
    }

    const before = fingerprint(sample);
    const { data: inserted, error: insertError } = await client
      .from('projects')
      .insert({
        user_id: userId,
        name: `SaveReload API ${now()}`,
        description: 'Automated privileged diagnostic — not user auth proof',
        manifest: sample,
      })
      .select('*')
      .single();
    if (insertError || !inserted?.id) {
      throw new Error(`API insert failed or returned no cleanup ID: ${insertError?.message ?? 'missing project ID'}`);
    }

    insertedId = inserted.id;
    record('api: insert project', true, insertedId);

    const { data: fetched, error: fetchError } = await client
      .from('projects')
      .select('*')
      .eq('id', insertedId)
      .single();
    if (fetchError || !fetched) {
      throw new Error(`API fetch after insert failed: ${fetchError?.message ?? 'not found'}`);
    }

    const afterInsert = fingerprint(fetched.manifest);
    const insertMatch = afterInsert.walls === before.walls &&
      afterInsert.openings === before.openings;
    record('api: manifest counts after insert', insertMatch,
      `walls ${afterInsert.walls}/${before.walls}, openings ${afterInsert.openings}/${before.openings}`);

    const updatedManifest = {
      ...sample,
      name: `${sample.name} (updated)`,
      metadata: { ...(sample.metadata ?? {}), saveReloadProof: now() },
    };
    const { data: updated, error: updateError } = await client
      .from('projects')
      .update({ manifest: updatedManifest, updated_at: now() })
      .eq('id', insertedId)
      .select('id');
    if (updateError || !Array.isArray(updated) || updated.length !== 1 || updated[0]?.id !== insertedId) {
      throw new Error(`API update did not affect exactly the test project: ${updateError?.message ?? 'row count mismatch'}`);
    }
    record('api: update manifest', true, afterInsert.hash);

    const { data: refetched, error: refetchError } = await client
      .from('projects')
      .select('*')
      .eq('id', insertedId)
      .single();
    if (refetchError || !refetched) {
      throw new Error(`API fetch after update failed: ${refetchError?.message ?? 'not found'}`);
    }

    const afterUpdate = fingerprint(refetched.manifest);
    const updateMatch = afterUpdate.walls === before.walls &&
      afterUpdate.openings === before.openings &&
      refetched.manifest.name === updatedManifest.name;
    record('api: manifest counts after update (reload simulation)', updateMatch,
      `walls ${afterUpdate.walls}, hash ${afterUpdate.hash}`);
    bodyPassed = insertMatch && updateMatch;
  } catch (error) {
    record('api: diagnostic failed', false, error instanceof Error ? error.message : String(error));
  } finally {
    if (insertedId) {
      try {
        const { data: deleted, error: deleteError } = await client
          .from('projects')
          .delete()
          .eq('id', insertedId)
          .select('id');
        cleanupPassed = !deleteError && Array.isArray(deleted) &&
          deleted.length === 1 && deleted[0]?.id === insertedId;
        record('api: cleanup test project', cleanupPassed,
          deleteError?.message ?? (cleanupPassed ? 'Exact inserted test row deleted' : 'Deletion did not confirm one affected row'));
      } catch (error) {
        record('api: cleanup test project', false,
          error instanceof Error ? error.message : String(error));
      }
    }
  }
  return bodyPassed && cleanupPassed;
}
