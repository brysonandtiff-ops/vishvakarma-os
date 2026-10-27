import { describe, expect, it } from 'vitest';
import { runServiceRoleProjectDiagnostic } from './supabase-api-diagnostic.mjs';

const USER = '01234567-89ab-cdef-0123-456789abcdef';
const ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const sample = { name: 'Sample House', walls: [{ id: 'w1' }], openings: [{ id: 'd1' }] };

function fakeClient(options = {}) {
  let manifest = structuredClone(sample);
  const events = [];
  let fetchCount = 0;
  return {
    events,
    from(table) {
      if (table === 'profiles') return {
        select() {
          return { eq() {
            return { async limit() {
              return { data: options.noProfile ? [] : [{ id: USER }], error: null };
            } };
          } };
        },
      };
      if (table !== 'projects') throw new Error(`unexpected table ${table}`);
      return {
        insert(data) {
          events.push(['insert', data.user_id]);
          return { select() {
            return { async single() {
              if (options.insertError) return { data: null, error: { message: 'insert refused' } };
              manifest = structuredClone(data.manifest);
              return { data: { id: ID, manifest }, error: null };
            } };
          } };
        },
        select() {
          return { eq(_key, id) {
            return { async single() {
              fetchCount++;
              events.push(['select', id, fetchCount]);
              if (options.failFetchAt === fetchCount) return { data: null, error: { message: 'fetch unavailable' } };
              return { data: { id, manifest: structuredClone(manifest) }, error: null };
            } };
          } };
        },
        update(data) {
          events.push(['update', data.manifest.name]);
          return { eq(_key, id) {
            return { async select() {
              if (options.failedUpdate) return { data: [], error: null };
              manifest = structuredClone(data.manifest);
              return { data: [{ id }], error: null };
            } };
          } };
        },
        delete() {
          return { eq(_key, id) {
            return { async select() {
              events.push(['delete', id]);
              if (options.deleteThrows) throw new Error('cleanup network failure');
              if (options.missingDelete) return { data: [], error: null };
              return { data: [{ id }], error: null };
            } };
          } };
        },
      };
    },
  };
}

async function run(options = {}) {
  const client = fakeClient(options);
  const records = [];
  const result = await runServiceRoleProjectDiagnostic({
    client,
    sample,
    userId: options.userId ?? USER,
    record: (...entry) => records.push(entry),
    now: () => '2026-10-27T02:00:00.000Z',
  });
  return { client, records, result };
}

describe('privileged Supabase diagnostic cleanup (not an RLS test)', () => {
  it('verifies read/update and exactly one deleted row on successful diagnostics', async () => {
    const { client, result, records } = await run();
    expect(result).toBe(true);
    expect(client.events.filter(([action]) => action === 'delete')).toEqual([['delete', ID]]);
    expect(records.find(([name]) => name === 'api: cleanup test project')?.[1]).toBe(true);
  });
  it('always deletes its test row when readback fails after insertion', async () => {
    const { client, result } = await run({ failFetchAt: 1 });
    expect(result).toBe(false);
    expect(client.events.some(([action, id]) => action === 'delete' && id === ID)).toBe(true);
  });
  it('always deletes its test row when update affects zero rows', async () => {
    const { client, result } = await run({ failedUpdate: true });
    expect(result).toBe(false);
    expect(client.events.some(([action]) => action === 'delete')).toBe(true);
  });
  it('never reports success when deletion returns zero affected rows', async () => {
    const { result, records } = await run({ missingDelete: true });
    expect(result).toBe(false);
    expect(records.find(([name]) => name === 'api: cleanup test project')?.[1]).toBe(false);
  });
  it('never reports success when cleanup throws', async () => {
    const { result, records } = await run({ deleteThrows: true });
    expect(result).toBe(false);
    expect(records.find(([name]) => name === 'api: cleanup test project')?.[1]).toBe(false);
  });
  it('does not touch project data without a dedicated, existing test profile', async () => {
    const { client, result } = await run({ noProfile: true });
    expect(result).toBe(false);
    expect(client.events).toHaveLength(0);
  });
  it('refuses a missing or invalid designated test user ID without touching projects', async () => {
    const { client, result } = await run({ userId: 'unknown' });
    expect(result).toBe(false);
    expect(client.events).toHaveLength(0);
  });
});
