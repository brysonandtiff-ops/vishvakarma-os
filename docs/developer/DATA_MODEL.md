# Data Model

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

Postgres schema, RLS summary, and Project Manifest reference.

Live schema inventory: [handoff/appendices/D-database-schema.md](../handoff/appendices/D-database-schema.md)

---

## Postgres tables (Supabase)

Applied via `supabase/migrations/`. Key application tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, role (`admin` for governance writes) |
| `projects` | Project metadata + manifest JSON |
| `project_collaborators` | Collaborator access (migration 005) |
| `billing` | Stripe customer ID, plan tier, status |
| `specs` | Locked governing specifications |
| `registry_entries` | Component/feature registry |
| `change_requests` | Governed change workflow |
| `releases` | Release pipeline records |
| `audit_logs` | Immutable event timeline |
| `optimization_batches` | Optimization run summaries |

Migrations and CLI: [supabase/README.md](../../supabase/README.md)

---

## Row Level Security (RLS)

All application tables enforce RLS. Summary:

- **Profiles / billing:** users read/write own rows
- **Projects:** owner + listed collaborators
- **Governance tables:** authenticated read; admin write via `profiles.role = 'admin'`
- **Storage (`materials` bucket):** public read; user-scoped write paths

Policy source: `supabase/migrations/20260212000003_rls_policies.sql`

Security details: [handoff/06-security-and-compliance.md](../handoff/06-security-and-compliance.md)

---

## Project Manifest

The manifest is stored in `projects.manifest` (JSONB) and is the **authoritative editor state**.

Core entities:

```typescript
interface ProjectManifest {
  version: string;
  name: string;
  walls: Wall[];
  openings: Opening[];
  materials: Material[];
  floorMaterial: string;
  lighting: LightingConfig;
  gridSize: number;
  snapToGrid: boolean;
  metadata: { created: string; modified: string; author?: string };
}
```

Full schema: [project-manifest-schema.md](../project-manifest-schema.md)

Manifest validation: `src/core/manifestSchema.ts`

---

## Billing entitlements

Plan tier stored in `billing.plan`: `starter` | `studio` | `enterprise`

Feature gates read billing state via `src/config/billingPlans.ts` and export tier helpers.

---

## Audit events

Governed actions write to `audit_logs` via `createAuditLog()` in `src/db/api.ts`. Event types include `project_created`, `spec_updated`, `change_request_accepted`, `release_created`.

---

## Related

- [API.md](./API.md) — facade functions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — data flow
- [specs/PROJECT_ROLES_AND_PERMISSIONS.md](../specs/PROJECT_ROLES_AND_PERMISSIONS.md) — RBAC spec
