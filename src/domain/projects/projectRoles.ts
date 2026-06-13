export const PROJECT_ROLES = [
  'owner',
  'co_owner',
  'architect',
  'builder',
  'engineer',
  'family',
  'council_reviewer',
  'viewer',
] as const;

export type ProjectMemberRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_PERMISSIONS = [
  'project.view',
  'project.comment',
  'project.edit_manifest',
  'project.manage_members',
  'project.manage_billing',
  'project.delete',
  'project.export',
  'project.run_ai_designer',
  'project.run_optimization',
  'project.review_compliance',
  'project.prepare_construction_docs',
  'project.update_construction_progress',
  'project.review_council_submission',
  'project.manage_governance',
] as const;

export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[number];

type RoleDefinition = {
  label: string;
  description: string;
  permissions: readonly ProjectPermission[];
  canInvite: readonly ProjectMemberRole[];
};

const VIEW_ONLY_PERMISSIONS = ['project.view'] as const;
const COMMENT_PERMISSIONS = ['project.view', 'project.comment'] as const;
const DESIGN_PERMISSIONS = [
  ...COMMENT_PERMISSIONS,
  'project.edit_manifest',
  'project.export',
  'project.run_ai_designer',
  'project.run_optimization',
  'project.review_compliance',
] as const;

export const PROJECT_ROLE_DEFINITIONS: Record<ProjectMemberRole, RoleDefinition> = {
  owner: {
    label: 'Owner',
    description: 'Full control over the project, members, billing, governance, and deletion.',
    permissions: PROJECT_PERMISSIONS,
    canInvite: ['co_owner', 'architect', 'builder', 'engineer', 'family', 'council_reviewer', 'viewer'],
  },
  co_owner: {
    label: 'Co-owner',
    description: 'Trusted partner with project, member, design, export, and governance control except billing/deletion.',
    permissions: [
      ...DESIGN_PERMISSIONS,
      'project.manage_members',
      'project.prepare_construction_docs',
      'project.update_construction_progress',
      'project.review_council_submission',
      'project.manage_governance',
    ],
    canInvite: ['architect', 'builder', 'engineer', 'family', 'council_reviewer', 'viewer'],
  },
  architect: {
    label: 'Architect',
    description: 'Professional design collaborator who can edit plans, run design tools, and prepare exports.',
    permissions: [...DESIGN_PERMISSIONS, 'project.prepare_construction_docs', 'project.manage_governance'],
    canInvite: ['viewer'],
  },
  builder: {
    label: 'Builder',
    description: 'Construction collaborator who can review docs, export packages, and update construction progress.',
    permissions: [
      ...COMMENT_PERMISSIONS,
      'project.export',
      'project.review_compliance',
      'project.prepare_construction_docs',
      'project.update_construction_progress',
    ],
    canInvite: ['viewer'],
  },
  engineer: {
    label: 'Engineer',
    description: 'Technical reviewer for compliance, buildability, and construction documentation.',
    permissions: [
      ...COMMENT_PERMISSIONS,
      'project.export',
      'project.review_compliance',
      'project.prepare_construction_docs',
    ],
    canInvite: ['viewer'],
  },
  family: {
    label: 'Family',
    description: 'Household stakeholder who can view and comment without changing project structure.',
    permissions: COMMENT_PERMISSIONS,
    canInvite: [],
  },
  council_reviewer: {
    label: 'Council reviewer',
    description: 'External reviewer who can inspect, comment, and review council submission context.',
    permissions: [...COMMENT_PERMISSIONS, 'project.review_council_submission', 'project.review_compliance'],
    canInvite: [],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access for quotes, walkthroughs, and non-editing stakeholders.',
    permissions: VIEW_ONLY_PERMISSIONS,
    canInvite: [],
  },
};

export function isProjectMemberRole(value: string): value is ProjectMemberRole {
  return PROJECT_ROLES.includes(value as ProjectMemberRole);
}

export function normalizeProjectMemberRole(value: string | null | undefined): ProjectMemberRole {
  if (value && isProjectMemberRole(value)) return value;
  return 'viewer';
}

export function getProjectRolePermissions(role: ProjectMemberRole): readonly ProjectPermission[] {
  return PROJECT_ROLE_DEFINITIONS[role].permissions;
}

export function hasProjectPermission(role: ProjectMemberRole, permission: ProjectPermission): boolean {
  return PROJECT_ROLE_DEFINITIONS[role].permissions.includes(permission);
}

export function canInviteProjectRole(inviterRole: ProjectMemberRole, inviteeRole: ProjectMemberRole): boolean {
  return PROJECT_ROLE_DEFINITIONS[inviterRole].canInvite.includes(inviteeRole);
}

export function describeProjectRole(role: ProjectMemberRole) {
  const definition = PROJECT_ROLE_DEFINITIONS[role];
  return {
    role,
    label: definition.label,
    description: definition.description,
    permissions: [...definition.permissions],
    canInvite: [...definition.canInvite],
  };
}
