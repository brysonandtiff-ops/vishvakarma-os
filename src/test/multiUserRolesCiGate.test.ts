import { describe, expect, it } from 'vitest';
import {
  PROJECT_ROLES,
  type ProjectMemberRole,
  type ProjectPermission,
  canInviteProjectRole,
  hasProjectPermission,
  normalizeProjectMemberRole,
} from '@/domain/projects/projectRoles';

type Actor = {
  id: string;
  label: string;
  role: ProjectMemberRole | null;
};

const actors: Actor[] = [
  { id: 'owner-user', label: 'Owner', role: 'owner' },
  { id: 'co-owner-user', label: 'Co-owner', role: 'co_owner' },
  { id: 'architect-user', label: 'Architect', role: 'architect' },
  { id: 'builder-user', label: 'Builder', role: 'builder' },
  { id: 'engineer-user', label: 'Engineer', role: 'engineer' },
  { id: 'family-user', label: 'Family', role: 'family' },
  { id: 'council-user', label: 'Council reviewer', role: 'council_reviewer' },
  { id: 'viewer-user', label: 'Viewer', role: 'viewer' },
  { id: 'stranger-user', label: 'Random non-member', role: null },
];

function canActor(actor: Actor, permission: ProjectPermission) {
  if (!actor.role) return false;
  return hasProjectPermission(actor.role, permission);
}

describe('multi-user project role CI gate', () => {
  it('keeps the known role list stable for owner/co-owner/family/admin-style project flows', () => {
    expect(PROJECT_ROLES).toEqual([
      'owner',
      'co_owner',
      'architect',
      'builder',
      'engineer',
      'family',
      'council_reviewer',
      'viewer',
    ]);
  });

  it('blocks strangers and read-only stakeholders from mutating a project', () => {
    const blocked: ProjectPermission[] = [
      'project.edit_manifest',
      'project.manage_members',
      'project.manage_billing',
      'project.delete',
      'project.run_ai_designer',
      'project.run_optimization',
      'project.manage_governance',
    ];

    const readOnlyActors = actors.filter((actor) => ['Family', 'Viewer', 'Council reviewer', 'Random non-member'].includes(actor.label));

    for (const actor of readOnlyActors) {
      for (const permission of blocked) {
        expect(canActor(actor, permission), `${actor.label} must not have ${permission}`).toBe(false);
      }
    }
  });

  it('proves owner remains the only role that can bill or delete', () => {
    for (const actor of actors) {
      expect(canActor(actor, 'project.manage_billing'), `${actor.label} billing access`).toBe(actor.role === 'owner');
      expect(canActor(actor, 'project.delete'), `${actor.label} delete access`).toBe(actor.role === 'owner');
    }
  });

  it('lets co-owners manage collaborators without billing/delete escalation', () => {
    expect(canActor(actors.find((actor) => actor.role === 'co_owner')!, 'project.manage_members')).toBe(true);
    expect(canInviteProjectRole('co_owner', 'architect')).toBe(true);
    expect(canInviteProjectRole('co_owner', 'family')).toBe(true);
    expect(canInviteProjectRole('co_owner', 'viewer')).toBe(true);
    expect(canInviteProjectRole('co_owner', 'co_owner')).toBe(false);
    expect(canInviteProjectRole('co_owner', 'owner')).toBe(false);
  });

  it('normalizes malformed or missing role input to viewer instead of privileged access', () => {
    expect(normalizeProjectMemberRole('owner')).toBe('owner');
    expect(normalizeProjectMemberRole('admin')).toBe('viewer');
    expect(normalizeProjectMemberRole('family_admin')).toBe('viewer');
    expect(normalizeProjectMemberRole(null)).toBe('viewer');
    expect(normalizeProjectMemberRole(undefined)).toBe('viewer');
  });
});
