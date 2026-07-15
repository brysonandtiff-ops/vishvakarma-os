import { describe, expect, it } from 'vitest';
import { mapAuditLogRow } from '@/backend/supabase/mappers';

describe('mapAuditLogRow', () => {
  it('preserves the authenticated actor id from Supabase rows', () => {
    const auditLog = mapAuditLogRow({
      id: 'event-1',
      action: 'project_updated',
      entity_type: 'project',
      entity_id: 'project-1',
      actor_id: 'b9ebfff5-868b-4d54-9740-aeac2676bfca',
      details: { name: 'Courtyard House' },
      timestamp: '2026-07-11T19:56:19.989Z',
    });

    expect(auditLog).toEqual({
      id: 'event-1',
      action: 'project_updated',
      entity_type: 'project',
      entity_id: 'project-1',
      actor_id: 'b9ebfff5-868b-4d54-9740-aeac2676bfca',
      details: { name: 'Courtyard House' },
      timestamp: '2026-07-11T19:56:19.989Z',
    });
  });

  it('keeps legacy audit rows compatible when no actor is recorded', () => {
    const auditLog = mapAuditLogRow({
      id: 'legacy-event',
      action: 'release_created',
      entity_type: 'release',
      details: null,
      created_at: '2026-05-01T00:00:00.000Z',
    });

    expect(auditLog.actor_id).toBeUndefined();
    expect(auditLog.details).toEqual({});
    expect(auditLog.timestamp).toBe('2026-05-01T00:00:00.000Z');
  });
});
