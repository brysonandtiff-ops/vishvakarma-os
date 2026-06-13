import { describe, expect, it } from 'vitest';
import {
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  canInviteProjectRole,
  describeProjectRole,
  getProjectRolePermissions,
  hasProjectPermission,
  normalizeProjectMemberRole,
} from '@/domain/projects/projectRoles';

describe('project role permissions', () => {
  it('keeps owner as the only billing and delete role', () => {
    expect(hasProjectPermission('owner', 'project.manage_billing')).toBe(true);
    expect(hasProjectPermission('owner', 'project.delete')).toBe(true);

    for (const role of PROJECT_ROLES.filter((role) => role !== 'owner')) {
      expect(hasProjectPermission(role, 'project.manage_billing')).toBe(false);
      expect(hasProjectPermission(role, 'project.delete')).toBe(false);
    }
  });

  it('lets co-owners manage members without granting billing or deletion', () => {
    expect(hasProjectPermission('co_owner', 'project.manage_members')).toBe(true);
    expect(hasProjectPermission('co_owner', 'project.manage_billing')).toBe(false);
    expect(hasProjectPermission('co_owner', 'project.delete')).toBe(false);
    expect(canInviteProjectRole('co_owner', 'builder')).toBe(true);
    expect(canInviteProjectRole('co_owner', 'co_owner')).toBe(false);
  });

  it('separates professional roles from family and viewer access', () => {
    expect(hasProjectPermission('architect', 'project.edit_manifest')).toBe(true);
    expect(hasProjectPermission('architect', 'project.run_ai_designer')).toBe(true);
    expect(hasProjectPermission('builder', 'project.update_construction_progress')).toBe(true);
    expect(hasProjectPermission('engineer', 'project.review_compliance')).toBe(true);

    expect(hasProjectPermission('family', 'project.comment')).toBe(true);
    expect(hasProjectPermission('family', 'project.edit_manifest')).toBe(false);
    expect(hasProjectPermission('viewer', 'project.comment')).toBe(false);
    expect(hasProjectPermission('viewer', 'project.view')).toBe(true);
  });

  it('keeps council reviewers read/comment/review only', () => {
    expect(hasProjectPermission('council_reviewer', 'project.view')).toBe(true);
    expect(hasProjectPermission('council_reviewer', 'project.comment')).toBe(true);
    expect(hasProjectPermission('council_reviewer', 'project.review_council_submission')).toBe(true);
    expect(hasProjectPermission('council_reviewer', 'project.review_compliance')).toBe(true);
    expect(hasProjectPermission('council_reviewer', 'project.edit_manifest')).toBe(false);
    expect(canInviteProjectRole('council_reviewer', 'viewer')).toBe(false);
  });

  it('normalizes unknown roles to viewer and exposes stable descriptions', () => {
    expect(normalizeProjectMemberRole('builder')).toBe('builder');
    expect(normalizeProjectMemberRole('unknown')).toBe('viewer');
    expect(normalizeProjectMemberRole(undefined)).toBe('viewer');

    const owner = describeProjectRole('owner');
    expect(owner.label).toBe('Owner');
    expect(owner.permissions).toEqual([...PROJECT_PERMISSIONS]);

    expect(getProjectRolePermissions('viewer')).toEqual(['project.view']);
  });
});
