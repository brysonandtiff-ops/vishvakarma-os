# Project Roles and Permissions

**Status:** v1 foundation  
**Runtime source of truth:** `src/domain/projects/projectRoles.ts` — role keys: `owner`, `co_owner`, `architect`, `builder`, `engineer`, `family`, `council_reviewer`, `viewer`  
**Test guard:** `src/test/projectRoles.test.ts`

Vishvakarma.OS projects need clear household, professional, builder, and reviewer access before broad external pilots. This spec defines the role vocabulary and permission expectations that future collaboration, invitations, billing, and audit-log work must preserve.

## Role model

| Role | Purpose | Can edit design | Can manage members | Can manage billing | Can delete project |
|------|---------|----------------:|-------------------:|-------------------:|-------------------:|
| Owner | Legal/account owner of the project | Yes | Yes | Yes | Yes |
| Co-owner | Trusted household/business partner | Yes | Yes | No | No |
| Architect | Professional design collaborator | Yes | Viewer-only invites | No | No |
| Builder | Construction collaborator | No design edits | Viewer-only invites | No | No |
| Engineer | Technical/compliance reviewer | No design edits | Viewer-only invites | No | No |
| Family | Household stakeholder | No | No | No | No |
| Council reviewer | External planning/compliance reviewer | No | No | No | No |
| Viewer | Read-only stakeholder | No | No | No | No |

## Permission groups

| Permission | Meaning |
|------------|---------|
| `project.view` | Can open and inspect the project. |
| `project.comment` | Can leave review/comment context. |
| `project.edit_manifest` | Can modify the project manifest/design. |
| `project.manage_members` | Can invite/remove non-owner collaborators. |
| `project.manage_billing` | Can manage plan/payment ownership. |
| `project.delete` | Can permanently delete the project. |
| `project.export` | Can export project files/packages. |
| `project.run_ai_designer` | Can run AI design generation. |
| `project.run_optimization` | Can run design optimization. |
| `project.review_compliance` | Can review compliance reports and warnings. |
| `project.prepare_construction_docs` | Can access construction-document workflows. |
| `project.update_construction_progress` | Can update builder/progress status. |
| `project.review_council_submission` | Can review council submission context. |
| `project.manage_governance` | Can interact with governance workflows for the project. |

## Non-negotiable invariants

1. Only `owner` can manage billing.
2. Only `owner` can delete a project.
3. `co_owner` can manage members but cannot invite another `owner` or `co_owner`.
4. `viewer` can only view.
5. `family` can view/comment but cannot edit, export, or run AI tools.
6. `council_reviewer` can view/comment/review compliance but cannot edit the design.
7. Builders can update construction progress but cannot alter the design manifest.

## Implementation notes

The current implementation is a deterministic permission matrix, not yet a complete invitation UI. Future work should store project membership in Supabase with an auditable table such as:

```sql
project_members (
  project_id uuid references projects(id),
  user_id uuid references auth.users(id),
  role text not null,
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (project_id, user_id)
)
```

Until then, this module acts as the product contract for role-based collaboration and protects the highest-value SaaS path: Owner / Co-owner / Family / Builder / Architect / Engineer / Council reviewer / Viewer.
